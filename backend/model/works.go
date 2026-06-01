// model/works.go
package model

import (
	"encoding/json"
	"time"
)

// Work 作品/项目展示模型，对应 works 表。
type Work struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	Type         string          `gorm:"size:16;default:MANUAL" json:"type"`
	RepoURL      *string         `gorm:"size:500" json:"repo_url"`
	Title        string          `gorm:"size:160;not null" json:"title"`
	Description  string          `gorm:"type:text;not null" json:"description"`
	AuthorName   string          `gorm:"size:120;not null" json:"author_name"`
	AuthorAvatar *string         `gorm:"size:500" json:"author_avatar"`
	Tags         json.RawMessage `gorm:"type:json;not null" json:"tags"`
	Color        string          `gorm:"size:16;default:#0A84FF" json:"color"`
	Status       string          `gorm:"size:32;default:开发中" json:"status"`
	Stars        int             `gorm:"default:0" json:"stars"`
	PreviewURL   *string         `gorm:"size:500" json:"preview_url"`
	IsFeatured   int8            `gorm:"default:1" json:"is_featured"`
	DisplayOrder int             `gorm:"default:0" json:"display_order"`
	LastSyncedAt *time.Time      `json:"last_synced_at"`
	CreatedAt    time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time       `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Work) TableName() string { return "works" }
