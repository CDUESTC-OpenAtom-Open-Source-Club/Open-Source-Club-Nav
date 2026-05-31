package model

import "gorm.io/gorm"

type NavItem struct {
	gorm.Model
	MenuTitle       string `json:"menu_title" gorm:"size:100;not null"`
	MenuSort        int    `json:"menu_sort" gorm:"default:0"`
	MenuActive      int    `json:"menu_active" gorm:"default:1"` // 1=显示，0=隐藏
	MenuLink        string `json:"menu_link" gorm:"size:255;default:''"`
	BusinessTable   string `json:"business_table" gorm:"size:50;default:''"` // 关联的业务表
	BusinessTableId int    `json:"business_table_id" gorm:"default:0"`       // 关联表的ID（0=整个表）
}

// 指定表名（确保和数据库表名一致）
func (NavItem) TableName() string {
	return "nav_items"
}
