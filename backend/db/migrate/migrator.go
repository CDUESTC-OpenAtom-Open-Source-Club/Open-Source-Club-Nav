package migrate

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"io/fs"
	"os"
	"sort"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	"gorm.io/gorm"

	// 如果你用MySQL，保留这行；用PostgreSQL则换成postgres
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// 直接读取本地db/migrate/migrations文件夹
var migrationFiles fs.FS = os.DirFS("db/migrate/migrations")

// Run 用golang-migrate执行迁移
// 参数dbDSN是数据库连接串，格式："mysql://用户名:密码@tcp(127.0.0.1:3306)/数据库名?charset=utf8mb4"
func Run(dbDSN string) error {
	// 迁移文件路径：对应你项目中migrations文件夹的位置（当前在db/migrate/migrations）
	m, err := migrate.New(
		"file://db/migrate/migrations",
		dbDSN,
	)
	if err != nil {
		return err
	}

	// 执行升级迁移（跑所有未执行的.up.sql）
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}

type migrationRecord struct {
	Version  string `gorm:"column:version"`
	Checksum string `gorm:"column:checksum"`
}

func ensureMigrationsTable(ctx context.Context, db *gorm.DB) error {
	return db.WithContext(ctx).Exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  applied_at DATETIME NOT NULL
)
`).Error
}

func loadAppliedMigrations(ctx context.Context, db *gorm.DB) (map[string]migrationRecord, error) {
	var rows []migrationRecord
	if err := db.WithContext(ctx).Raw(`
SELECT version, checksum
FROM schema_migrations
ORDER BY version ASC
`).Scan(&rows).Error; err != nil {
		return nil, err
	}

	result := make(map[string]migrationRecord, len(rows))
	for _, row := range rows {
		result[row.Version] = row
	}
	return result, nil
}

type migrationFile struct {
	Version  string // 迁移版本（比如"001"）
	Name     string // 文件名
	Content  []byte // 文件内容
	Checksum string // 校验和
	SQL      []byte // SQL语句
}

func loadMigrationFiles() ([]migrationFile, error) {
	entries, err := fs.ReadDir(migrationFiles, "migrations")
	if err != nil {
		return nil, err
	}

	files := make([]migrationFile, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		// 替换原来的content, err := migrationFiles.ReadFile(...)
		file, err := migrationFiles.Open("migrations/" + entry.Name())
		if err != nil {
			return nil, err
		}
		defer file.Close() // 记得关闭文件

		content, err := io.ReadAll(file)
		if err != nil {
			return nil, err
		}

		sum := sha256.Sum256(content)
		files = append(files, migrationFile{
			Name:     entry.Name(),
			Version:  strings.TrimSuffix(entry.Name(), ".sql"),
			Checksum: hex.EncodeToString(sum[:]),
			SQL:      content,
		})
	}

	sort.Slice(files, func(i, j int) bool {
		return files[i].Name < files[j].Name
	})
	return files, nil
}

func splitSQLStatements(sqlText string) []string {
	var statements []string
	var current strings.Builder
	inSingleQuote := false
	inDoubleQuote := false
	inBacktick := false

	lines := strings.Split(sqlText, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "--") || strings.HasPrefix(trimmed, "#") {
			continue
		}

		current.WriteString(line)
		current.WriteByte('\n')
		text := current.String()

		var chunk strings.Builder
		for i := 0; i < len(text); i++ {
			ch := text[i]
			prevEscaped := i > 0 && text[i-1] == '\\'

			switch ch {
			case '\'':
				if !inDoubleQuote && !inBacktick && !prevEscaped {
					inSingleQuote = !inSingleQuote
				}
			case '"':
				if !inSingleQuote && !inBacktick && !prevEscaped {
					inDoubleQuote = !inDoubleQuote
				}
			case '`':
				if !inSingleQuote && !inDoubleQuote {
					inBacktick = !inBacktick
				}
			case ';':
				if !inSingleQuote && !inDoubleQuote && !inBacktick {
					statement := strings.TrimSpace(chunk.String())
					if statement != "" {
						statements = append(statements, statement)
					}
					chunk.Reset()
					continue
				}
			}

			chunk.WriteByte(ch)
		}

		current.Reset()
		current.WriteString(chunk.String())
	}

	if tail := strings.TrimSpace(current.String()); tail != "" {
		statements = append(statements, tail)
	}

	return statements
}
