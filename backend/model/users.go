// model/user.go
package model

import "time"

type User struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	Email        string     `gorm:"column:email" json:"email"`
	PasswordHash string     `gorm:"column:password_hash" json:"-"`
	Role         string     `gorm:"column:role" json:"role"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt    *time.Time `gorm:"column:deleted_at" json:"-"`
	Username     string     `gorm:"column:username" json:"username"`
	Password     string     `gorm:"-" json:"password,omitempty"`
}

func (User) TableName() string {
	return "users"
}
