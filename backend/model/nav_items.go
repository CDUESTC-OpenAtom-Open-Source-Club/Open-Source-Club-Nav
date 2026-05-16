// model/nav_item.go
package model

import "time"

type NavItem struct {
	ID         uint      `gorm:"primaryKey"`       
	Title      string    `gorm:"column:title"`   
	Content    string    `gorm:"column:content"`   
	CoverUrl   string    `gorm:"column:cover_url"` 
	LinkUrl    string    `gorm:"column:link_url"`  
	CreatedAt  time.Time `gorm:"column:created_at"`
	UpdatedAt  time.Time `gorm:"column:updated_at"`
}

func (NavItem) TableName() string {
	return "nav_items"
}
