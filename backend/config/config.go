// config/config.go
package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

// 配置结构体，与config.yaml的字段一一对应
type Config struct {
	MySQL struct { // 对应yaml里的mysql节点
		DSN string `yaml:"dsn"`
	} `yaml:"mysql"`
	JWT struct { // 对应yaml里的jwt节点
		Secret string `yaml:"secret"`
		Expire int    `yaml:"expire"`
	} `yaml:"jwt"`
}

// 加载配置文件
func LoadConfig() Config {
	var cfg Config
	// 读取config.yaml文件（路径是backend/config/config.yaml）
	file, err := os.ReadFile("config/config.yaml")
	if err != nil {
		panic("加载配置文件失败: " + err.Error())
	}
	// 解析yaml到结构体
	if err := yaml.Unmarshal(file, &cfg); err != nil {
		panic("解析配置文件失败: " + err.Error())
	}
	return cfg
}
