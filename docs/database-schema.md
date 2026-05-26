# 社团导航站 数据表设计

数据库：SQLlite

## `users`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | |
| `email` | `VARCHAR(100)` | 非空，唯一 | 邮箱 |
| `password_hash` | `VARCHAR(255)` | 非空 | bcrypt 哈希 |
| `role` | `user_role` | 非空，默认 `editor` | `super` / `editor` |
| `created_at` | `TIMESTAMPTZ` | 非空，默认当前时间 | |
| `updated_at` | `TIMESTAMPTZ` | 非空，默认当前时间 | |

## `nav_items`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | |
| `title` | `VARCHAR(120)` | 非空 | 首页显示的短标题 |
| `content` | `TEXT` | 非空，默认 `''` | 长内容 |
| `cover_url` | `VARCHAR(500)` | 非空，默认 `''` | 封面图 |
| `link_url` | `VARCHAR(500)` | 非空，默认 `''` | 要导航到的目标链接 |
| `created_at` | `TIMESTAMPTZ` | 非空，默认当前时间 | |
| `updated_at` | `TIMESTAMPTZ` | 非空，默认当前时间 | |

## `misc`

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | `BIGSERIAL` | 主键 | |
| `other` | `JSONB` | 非空，默认 `{}` | 随便塞，各种杂项信息 |
