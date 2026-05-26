package migrate

import (
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"fmt"
	"io/fs"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

type migrationRecord struct {
	Version  string
	Checksum string
}

type migrationFile struct {
	Name     string
	Version  string
	Checksum string
	SQL      string
}

func Run(ctx context.Context, db *gorm.DB) error {
	if err := ensureMigrationsTable(ctx, db); err != nil {
		return err
	}

	applied, err := loadAppliedMigrations(ctx, db)
	if err != nil {
		return err
	}

	files, err := loadMigrationFiles()
	if err != nil {
		return err
	}

	for _, file := range files {
		if record, ok := applied[file.Version]; ok {
			if record.Checksum != file.Checksum {
				return fmt.Errorf("migration checksum mismatch for %s", file.Name)
			}
			continue
		}

		statements := splitSQLStatements(file.SQL)
		for _, stmt := range statements {
			if err := db.WithContext(ctx).Exec(stmt).Error; err != nil {
				return fmt.Errorf("apply migration %s: %w", file.Name, err)
			}
		}

		if err := db.WithContext(ctx).Exec(
			`INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (?, ?, ?, ?)`,
			file.Version,
			file.Name,
			file.Checksum,
			time.Now().UTC(),
		).Error; err != nil {
			return fmt.Errorf("record migration %s: %w", file.Name, err)
		}
	}

	return nil
}

func ensureMigrationsTable(ctx context.Context, db *gorm.DB) error {
	return db.WithContext(ctx).Exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  checksum CHAR(64) NOT NULL,
  applied_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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

		content, err := migrationFiles.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return nil, err
		}

		sum := sha256.Sum256(content)
		files = append(files, migrationFile{
			Name:     entry.Name(),
			Version:  strings.TrimSuffix(entry.Name(), ".sql"),
			Checksum: hex.EncodeToString(sum[:]),
			SQL:      string(content),
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
