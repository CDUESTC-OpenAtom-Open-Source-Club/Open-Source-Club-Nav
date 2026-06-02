// utils/password.go
package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/scrypt"
)

// 与 Next BFF（frontend/apps/web/src/lib/admin-auth.ts）保持一致的口令哈希格式：
//
//	scrypt:<saltHex>:<digestHex>
//
// 其中 saltHex 为 16 字节随机盐的十六进制串（32 个字符），scrypt 参数与 Node
// crypto.scryptSync 的默认值一致（N=16384, r=8, p=1, keyLen=64），且盐以其十六进制
// 字符串本身的字节参与计算（Node 把字符串盐按 UTF-8 取字节）。这样同一账号可在
// Go 后端与 Next BFF 之间互通登录。
const (
	scryptN      = 16384
	scryptR      = 8
	scryptP      = 1
	scryptKeyLen = 64
	scryptPrefix = "scrypt:"
)

// HashPassword 生成与 Next 兼容的 scrypt 口令哈希。
func HashPassword(password string) (string, error) {
	saltRaw := make([]byte, 16)
	if _, err := rand.Read(saltRaw); err != nil {
		return "", err
	}
	saltHex := hex.EncodeToString(saltRaw)
	dk, err := scrypt.Key([]byte(password), []byte(saltHex), scryptN, scryptR, scryptP, scryptKeyLen)
	if err != nil {
		return "", err
	}
	return scryptPrefix + saltHex + ":" + hex.EncodeToString(dk), nil
}

// VerifyPassword 校验口令。优先按 scrypt 格式校验；对历史遗留的 bcrypt 哈希做兼容校验。
// 返回 legacy=true 表示该哈希是旧 bcrypt 格式且校验通过，调用方应在登录成功后重哈希为 scrypt。
func VerifyPassword(password, stored string) (ok bool, legacy bool) {
	if strings.HasPrefix(stored, scryptPrefix) {
		parts := strings.Split(stored, ":")
		if len(parts) != 3 {
			return false, false
		}
		saltHex, digestHex := parts[1], parts[2]
		dk, err := scrypt.Key([]byte(password), []byte(saltHex), scryptN, scryptR, scryptP, scryptKeyLen)
		if err != nil {
			return false, false
		}
		return subtle.ConstantTimeCompare([]byte(hex.EncodeToString(dk)), []byte(digestHex)) == 1, false
	}

	// 历史遗留：bcrypt 哈希（$2a$/$2b$/$2y$）。校验通过则提示调用方重哈希。
	if strings.HasPrefix(stored, "$2") {
		if err := bcrypt.CompareHashAndPassword([]byte(stored), []byte(password)); err == nil {
			return true, true
		}
	}
	return false, false
}
