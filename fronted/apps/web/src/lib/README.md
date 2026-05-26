# src/lib 目录说明

这里存放数据库、鉴权和后台服务层逻辑，是页面和接口背后的基础能力。

## 文件说明
- `db.ts`：MySQL 连接池与数据库访问入口
- `admin-auth.ts`：后台密码哈希、会话生成、Cookie 读写
- `admin-db.ts`：后台表初始化、默认管理员引导、辅助查询

数据库结构参考文件已归档到 `database/schema.sql`。

## 维护建议
- 页面和 route 不要自己拼接重复的数据库连接逻辑，优先走这里。
- 遇到后台登录、权限、Cookie、管理员初始化问题时，先看 `admin-auth.ts` 和 `admin-db.ts`。
- 如果数据库表结构调整，记得同步更新 `database/schema.sql` 和初始化脚本。
