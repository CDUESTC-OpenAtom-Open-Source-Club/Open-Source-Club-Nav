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
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		if _, err := os.Stat("config.local.yaml"); err == nil {
			configPath = "config.local.yaml"
		} else {
			configPath = "config.yaml"
		}
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
