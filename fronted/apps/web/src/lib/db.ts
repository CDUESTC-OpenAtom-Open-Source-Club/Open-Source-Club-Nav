// MySQL 数据库连接
// 使用 mysql2 的 Promise 连接池

import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "kcos_nav",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
