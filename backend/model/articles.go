package model

import "gorm.io/gorm"

type Article struct {
	gorm.Model
	Category string `json:"category" gorm:"size:50;not null"`
	Title    string `json:"title" gorm:"size:200;not null;unique"`
	CoverUrl string `json:"cover_url" gorm:"size:255"`
	Content  string `json:"content" gorm:"type:text;not null"`
	Author   string `json:"author" gorm:"size:50;not null"`
	Status   int    `json:"status" gorm:"default:1"` // 1=发布，0=草稿
	Sort     int    `json:"sort" gorm:"default:0"`
}

// 指定表名
func (Article) TableName() string {
	return "articles"
}

