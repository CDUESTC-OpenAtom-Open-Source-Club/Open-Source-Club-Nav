// model/user.go
package model

import (
	"errors"
	"time" // Import the time package to handle date and time operations

	"gorm.io/gorm" // Import the gorm package to interact with the database
)

type User struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Email        string     `gorm:"column:email" json:"email"`
	PasswordHash string     `gorm:"column:password_hash" json:"-"`
	Role         string     `gorm:"column:role" json:"role"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"-"`
	Username     string     `gorm:"column:username" json:"username"`
	Password     string     `gorm:"column:password" json:"password,omitempty"`
	Session      string     `gorm:"column:session;index" json:"-"`
}

func (User) TableName() string {
	return "users"
}

// BeforeCreate 创建User前校验
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Username == "" {
		return errors.New("用户名不能为空")
	}
	if u.Email == "" {
		return errors.New("邮箱不能为空")
	}
	return nil
}

// BeforeUpdate 更新User时复用校验逻辑
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	return u.BeforeCreate(tx)
}
