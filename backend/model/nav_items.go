package model

import "time"

type NavItem struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	ContentType     string    `gorm:"column:content_type" json:"content_type"`
	SubType         string    `gorm:"column:sub_type" json:"sub_type,omitempty"`
	Icon            string    `gorm:"column:icon" json:"icon,omitempty"`
	Title           string    `gorm:"column:title" json:"title"`
	Description     string    `gorm:"column:description" json:"description"`
	Content         string    `gorm:"column:content" json:"content"`
	Sort            int       `gorm:"column:sort" json:"sort"`
	Active          int       `gorm:"column:active" json:"active"`
	Category        string    `gorm:"column:category" json:"category"`
	GameType        string    `gorm:"column:game_type" json:"game_type,omitempty"`
	IconUrl         string    `gorm:"column:icon_url" json:"icon_url,omitempty"`
	CoverUrl        string    `gorm:"column:cover_url" json:"cover_url"`
	LinkUrl         string    `gorm:"column:link_url" json:"link_url"`
	CreatedBy       int       `gorm:"column:created_by" json:"created_by,omitempty"`
	UpdatedBy       int       `gorm:"column:updated_by" json:"updated_by,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	BusinessTable   string    `gorm:"column:business_table" json:"business_table,omitempty"`
	BusinessTableId int       `gorm:"column:business_table_id" json:"business_table_id,omitempty"`
}

func (NavItem) TableName() string {
	return "nav_items"
}
