package model

import (
	"gorm.io/gorm"
)

type NavItem struct {
	gorm.Model
	MenuTitle       string  `json:"menu_title" gorm:"size:100;not null"`
	MenuSort        int     `json:"menu_sort" gorm:"default:0"`
	MenuActive      int     `json:"menu_active" gorm:"default:1"` // 1=显示，0=隐藏
	MenuLink        string  `json:"menu_link" gorm:"size:255;default:''"`
	BusinessTable   string  `json:"business_table" gorm:"size:50;default:''"` // 关联的业务表
	BusinessTableId int     `json:"business_table_id" gorm:"default:0"`       // 关联表的ID（0=整个表）
	ID              uint    `gorm:"primaryKey" json:"id"`
	ContentType     string  `gorm:"column:content_type" json:"content_type"`
	SubType         *string `gorm:"column:sub_type" json:"sub_type,omitempty"`
	Title           string  `gorm:"column:title" json:"title"`
	Content         string  `gorm:"column:content" json:"content"`
	Description     string  `gorm:"column:description" json:"description"`
	CoverUrl        string  `gorm:"column:cover_url" json:"cover_url"`
	LinkUrl         string  `gorm:"column:link_url" json:"link_url"`
	Sort            int     `gorm:"column:sort" json:"sort"`
	Active          int     `gorm:"column:active" json:"active"`
	Icon            *string `gorm:"column:icon" json:"icon,omitempty"`
	IconURL         string  `gorm:"column:icon_url;type:varchar(255)" json:"icon_url"`
	CreatedBy       uint    `gorm:"column:created_by" json:"-"` // 内部字段，忽略序列化
	UpdatedBy       uint    `gorm:"column:updated_by" json:"-"`
	Category        *string `gorm:"column:category" json:"category,omitempty"`
	GameType        *string `gorm:"column:game_type" json:"game_type,omitempty"`
}

// 指定表名（确保和数据库表名一致）
func (NavItem) TableName() string {
	return "nav_items"
}
