// model/nav_item.go
package model

import "time"

type NavItem struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ContentType string    `gorm:"column:content_type" json:"content_type"`
	SubType     *string   `gorm:"column:sub_type" json:"sub_type,omitempty"`
	Title       string    `gorm:"column:title" json:"title"`
	Content     string    `gorm:"column:content" json:"content"`
	Description string    `gorm:"column:description" json:"description"`
	CoverUrl    string    `gorm:"column:cover_url" json:"cover_url"`
	LinkUrl     string    `gorm:"column:link_url" json:"link_url"`
	Sort        int       `gorm:"column:sort" json:"sort"`
	Active      int       `gorm:"column:active" json:"active"`
	Icon        *string   `gorm:"column:icon" json:"icon,omitempty"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updated_at"`
	Category    *string   `gorm:"column:category" json:"category,omitempty"`
	GameType    *string   `gorm:"column:game_type" json:"game_type,omitempty"`
}

func (NavItem) TableName() string {
	return "nav_items"
}
