package utils

import (
	"crypto/rand"
	"encoding/base64"
)

// GenerateSession 用crypto/rand生成安全的随机Session
func GenerateSession() (string, error) {
	// 生成32字节随机数（足够安全）
	buf := make([]byte, 32)
	_, err := rand.Read(buf)
	if err != nil {
		return "", err
	}
	// 转成Base64方便存储和传输
	return base64.URLEncoding.EncodeToString(buf), nil
}
