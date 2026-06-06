package model

import "time"

type NavItem struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Title           string    `gorm:"column:title" json:"title"`                         // 表中存在
	Content         string    `gorm:"column:content" json:"content"`                     // 表中存在
	CoverUrl        string    `gorm:"column:cover_url" json:"cover_url"`                 // 表中存在
	LinkUrl         string    `gorm:"column:link_url" json:"link_url"`                   // 表中存在
	CreatedAt       time.Time `json:"created_at"`                                        // 表中存在
	UpdatedAt       time.Time `json:"updated_at"`                                        // 表中存在
	BusinessTable   string    `gorm:"column:business_table" json:"business_table"`       // 表中存在
	BusinessTableId int       `gorm:"column:business_table_id" json:"business_table_id"` // 表中存在
}

func (NavItem) TableName() string {
	return "nav_items"
}
