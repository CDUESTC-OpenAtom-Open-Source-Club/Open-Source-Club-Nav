// utils/password_test.go
package utils

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

// 该向量由 Next 端 Node crypto.scryptSync 生成（见 admin-auth.ts 的 hashPassword）：
//
//	node -e "const {scryptSync}=require('crypto'); const salt='00112233445566778899aabbccddeeff';
//	         console.log('scrypt:'+salt+':'+scryptSync('test123456', salt, 64).toString('hex'))"
//
// Go 必须复现出完全一致的结果，否则两层无法互通登录。
const nodeVector = "scrypt:00112233445566778899aabbccddeeff:" +
	"4b5d06bd65b9fb2688dcd085f5f1b94993712016bee055da0ce459ba84d8da55" +
	"5c5667f4a782ea65d382293e3fd96df34619f10d587243685cc7327bf6799752"

func TestVerifyMatchesNodeScryptVector(t *testing.T) {
	ok, legacy := VerifyPassword("test123456", nodeVector)
	if !ok {
		t.Fatalf("scrypt 校验未通过 Node 向量，两层口令哈希不兼容")
	}
	if legacy {
		t.Fatalf("scrypt 向量被误判为 legacy")
	}
	if ok, _ := VerifyPassword("wrong-password", nodeVector); ok {
		t.Fatalf("错误口令不应通过校验")
	}
}

func TestHashRoundTripAndFormat(t *testing.T) {
	hash, err := HashPassword("hunter2-secret")
	if err != nil {
		t.Fatalf("HashPassword 失败: %v", err)
	}
	// 期望格式 scrypt:<32位盐hex>:<128位摘要hex>
	if len(hash) != len("scrypt:")+32+1+128 {
		t.Fatalf("哈希格式长度不符: %q", hash)
	}
	ok, legacy := VerifyPassword("hunter2-secret", hash)
	if !ok || legacy {
		t.Fatalf("自洽校验失败 ok=%v legacy=%v", ok, legacy)
	}
}

func TestVerifyLegacyBcrypt(t *testing.T) {
	// 历史遗留的 bcrypt 哈希应被识别、校验通过并标记 legacy（供登录后重哈希为 scrypt）。
	raw, err := bcrypt.GenerateFromPassword([]byte("legacy-pass-1"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("生成 bcrypt 哈希失败: %v", err)
	}
	ok, legacy := VerifyPassword("legacy-pass-1", string(raw))
	if !ok || !legacy {
		t.Fatalf("legacy bcrypt 校验应通过且标记 legacy, 实际 ok=%v legacy=%v", ok, legacy)
	}
	if ok, _ := VerifyPassword("nope", string(raw)); ok {
		t.Fatalf("错误口令不应通过 legacy bcrypt 校验")
	}
}
