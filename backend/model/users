// model/user.go
package model

import "time"

type User struct {
	ID            uint      `gorm:"primaryKey"`
	Email         string    `gorm:"column:email"`
	PasswordHash  string    `gorm:"column:password_hash"` 
	Role          string    `gorm:"column:role"`
	CreatedAt     time.Time `gorm:"column:created_at"`
	UpdatedAt     time.Time `gorm:"column:updated_at"`
	DeletedAt     *time.Time `gorm:"column:deleted_at"` 
	Username      string    `gorm:"column:username"`
	Password      string    `gorm:"column:password"`
}

func (User) TableName() string {
	return "users"
}
