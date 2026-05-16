// config/config.go
package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	MySQL struct {
		DSN string `yaml:"dsn"`
	} `yaml:"mysql"`
	JWT struct {
		Secret string `yaml:"secret"`
		Expire int    `yaml:"expire"`
	} `yaml:"jwt"`
}

// 首字母大写，导出函数
func LoadConfig() Config {
	var cfg Config
	file, err := os.Open("config.yaml")
	if err != nil {
		panic("无法打开config.yaml: " + err.Error())
	}
	defer file.Close()
	if err := yaml.NewDecoder(file).Decode(&cfg); err != nil {
		panic("解析config.yaml失败: " + err.Error())
	}
	return cfg
}
