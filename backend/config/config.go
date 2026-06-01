// config/config.go
package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	// Database 段：当前使用 SQLite。path 是嵌入式数据库文件路径。
	Database struct {
		Path string `yaml:"path"`
	} `yaml:"database"`
	// MySQL 段：仅为向后兼容，保留但已弃用。
	MySQL struct {
		DSN string `yaml:"dsn"`
	} `yaml:"mysql"`
	JWT struct {
		Secret string `yaml:"secret"`
		Expire int    `yaml:"expire"`
	} `yaml:"jwt"`
}

// DBPath 返回 SQLite 数据库文件路径，默认 data/app.db
func (c Config) DBPath() string {
	if c.Database.Path != "" {
		return c.Database.Path
	}
	if env := os.Getenv("DB_PATH"); env != "" {
		return env
	}
	return "data/app.db"
}

// 首字母大写，导出函数
func LoadConfig() Config {
	var cfg Config
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		for _, candidate := range []string{"config.local.yaml", "config.yaml", "config.example.yaml"} {
			if _, err := os.Stat(candidate); err == nil {
				configPath = candidate
				break
			}
		}
	}
	if configPath == "" {
		panic("未找到配置文件：config.local.yaml / config.yaml / config.example.yaml")
	}

	file, err := os.Open(configPath)
	if err != nil {
		panic("无法打开配置文件 " + configPath + ": " + err.Error())
	}
	defer file.Close()
	if err := yaml.NewDecoder(file).Decode(&cfg); err != nil {
		panic("解析配置文件失败: " + err.Error())
	}
	return cfg
}
