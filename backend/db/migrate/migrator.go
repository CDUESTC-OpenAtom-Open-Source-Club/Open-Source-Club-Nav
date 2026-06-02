package migrate

import (
	"github.com/golang-migrate/migrate/v4"
	// 如果你用MySQL，保留这行；用PostgreSQL则换成postgres
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

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
