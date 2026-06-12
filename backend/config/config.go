// config包负责加载应用程序的YAML配置，包括数据库、JWT等参数的解析、校验与管理
package config

import (
	"os"
	"strconv"

	"errors"
	"fmt"
	"net/url"
	"sync"

	"gopkg.in/yaml.v3"
)

// 单独定义MySQLConfig子结构体（更清晰）
type MySQLConfig struct {
	Host     string `yaml:"host"`     // 数据库地址
	Port     int    `yaml:"port"`     // 数据库端口
	User     string `yaml:"user"`     // 数据库用户名
	Password string `yaml:"password"` // 数据库密码
	Database string `yaml:"database"` // 数据库名
}

// 单独定义JWTConfig子结构体
type JWTConfig struct {
	Secret string `yaml:"secret"` // JWT密钥
	Expire int    `yaml:"expire"` // JWT过期时间
}
type CORSConfig struct {
	AllowedOrigins string `yaml:"allowed_origins"` // 允许的跨域域名（逗号分隔）
}

type ServerConfig struct {
	Addr string `yaml:"addr"`
}

type DeployConfig struct {
	RepoPath     string   `yaml:"repo_path"`
	UpdateScript string   `yaml:"update_script"`
	AllowedTags  []string `yaml:"allowed_tags"`
}

// 总配置结构体（嵌套子结构体）
type Config struct {
	MySQL  MySQLConfig  `yaml:"mysql"` // 数据库配置
	JWT    JWTConfig    `yaml:"jwt"`   // JWT配置
	Redis  RedisConfig  `yaml:"redis"`
	CORS   CORSConfig   `yaml:"cors"` // CORS配置
	Server ServerConfig `yaml:"server"`
	Deploy DeployConfig `yaml:"deploy"`
}

// 新增：Redis配置子结构体
type RedisConfig struct {
	Addr     string `yaml:"addr"`     // Redis地址（如localhost:6379）
	Password string `yaml:"password"` // Redis密码（无密码则为空）
	DB       int    `yaml:"db"`       // Redis数据库编号（默认0）
}

// 单例变量：确保配置只加载一次
var (
	configOnce     sync.Once
	configInstance *Config
)

// GetConfig 单例模式获取配置（全局只加载一次）
func GetConfig() *Config {
	configOnce.Do(func() {
		// 现在LoadConfig返回的是指针，直接赋值即可
		configInstance = LoadConfig()
	})
	return configInstance
}

// LoadConfig 加载配置文件并返回Config指针
func LoadConfig() *Config {
	var cfg Config
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}

	file, err := os.Open(configPath)
	if err != nil {
		panic("无法打开配置文件 " + configPath + ": " + err.Error())
	}
	defer file.Close()

	if err = yaml.NewDecoder(file).Decode(&cfg); err != nil {
		panic("解析配置文件失败: " + err.Error())
	}

	// 环境变量覆盖配置
	// MySQL 配置
	if mysqlHost := os.Getenv("MYSQL_HOST"); mysqlHost != "" {
		cfg.MySQL.Host = mysqlHost
	}
	if mysqlPort := os.Getenv("MYSQL_PORT"); mysqlPort != "" {
		if port, err := strconv.Atoi(mysqlPort); err == nil {
			cfg.MySQL.Port = port
		}
	}
	if mysqlUser := os.Getenv("MYSQL_USER"); mysqlUser != "" {
		cfg.MySQL.User = mysqlUser
	}
	if mysqlPwd := os.Getenv("MYSQL_PASSWORD"); mysqlPwd != "" {
		cfg.MySQL.Password = mysqlPwd
	}
	if mysqlDB := os.Getenv("MYSQL_DATABASE"); mysqlDB != "" {
		cfg.MySQL.Database = mysqlDB
	}

	// JWT 配置
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		cfg.JWT.Secret = jwtSecret
	}
	if jwtExpire := os.Getenv("JWT_EXPIRE"); jwtExpire != "" {
		if expire, err := strconv.Atoi(jwtExpire); err == nil {
			cfg.JWT.Expire = expire
		}
	}

	// Redis 配置
	if redisAddr := os.Getenv("REDIS_ADDR"); redisAddr != "" {
		cfg.Redis.Addr = redisAddr
	}
	if redisPwd := os.Getenv("REDIS_PASSWORD"); redisPwd != "" {
		cfg.Redis.Password = redisPwd
	}
	if redisDB := os.Getenv("REDIS_DB"); redisDB != "" {
		if db, err := strconv.Atoi(redisDB); err == nil {
			cfg.Redis.DB = db
		}
	}

	// CORS 配置
	if corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); corsOrigins != "" {
		cfg.CORS.AllowedOrigins = corsOrigins
	}

	// 服务器配置
	if serverAddr := os.Getenv("SERVER_ADDR"); serverAddr != "" {
		cfg.Server.Addr = serverAddr
	}
	// 新增：配置校验（这行是要加的）
	if err := (&cfg).Validate(); err != nil {
		panic("配置校验失败: " + err.Error())
	}

	// 返回指针
	return &cfg
}

func (c *Config) ServerAddr() string {
	if c.Server.Addr == "" {
		return ":8080"
	}
	return c.Server.Addr
}

// BuildDSN 动态构建MySQL的DSN字符串
func (c *Config) BuildDSN() string {
	// 编码密码里的特殊字符
	encodedPwd := url.QueryEscape(c.MySQL.Password)
	// 拼接DSN（和你原来的格式一致）
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.MySQL.User, encodedPwd, c.MySQL.Host, c.MySQL.Port, c.MySQL.Database,
	)
}

// Validate 校验配置的合法性
func (c *Config) Validate() error {
	// 校验JWT Secret不能为空
	if c.JWT.Secret == "" {
		return errors.New("JWT Secret不能为空")
	}
	// 校验JWT Expire不能小于0
	if c.JWT.Expire <= 0 {
		return errors.New("JWT Expire必须大于0")
	}
	// 校验MySQL Host不能为空
	if c.MySQL.Host == "" {
		return errors.New("MySQL Host不能为空")
	}
	// 校验MySQL Port在合法范围（1-65535）
	if c.MySQL.Port < 1 || c.MySQL.Port > 65535 {
		return errors.New("MySQL Port必须在1-65535之间")
	}
	// 校验MySQL User不能为空
	if c.MySQL.User == "" {
		return errors.New("MySQL User不能为空")
	}
	// 校验MySQL Database不能为空
	if c.MySQL.Database == "" {
		return errors.New("MySQL Database不能为空")
	}
	// 所有校验通过
	return nil
}
