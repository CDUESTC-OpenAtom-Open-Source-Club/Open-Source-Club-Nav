// model/works.go
package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// 自定义Tags类型（替换原来的json.RawMessage）
type Tags []string

// Value：将Tags序列化为JSON存入数据库
func (t Tags) Value() (driver.Value, error) {
	return json.Marshal(t)
}

// Scan：从数据库读取JSON反序列化为Tags
func (t *Tags) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("tags字段应为JSON格式字符串")
	}
	return json.Unmarshal(b, t)
}

// Work 作品/项目展示模型，对应 works 表。
type Work struct {
	ID           uint    `gorm:"primaryKey" json:"id"`
	Type         string  `gorm:"size:16;default:MANUAL" json:"type"`
	RepoURL      *string `gorm:"size:500" json:"repo_url"`
	Title        string  `gorm:"size:160;not null" json:"title"`
	Description  string  `gorm:"type:text;not null" json:"description"`
	AuthorName   string  `gorm:"size:120;not null" json:"author_name"`
	AuthorAvatar *string `gorm:"size:500" json:"author_avatar"`
	// 用自定义Tags替换json.RawMessage
	Tags         Tags       `gorm:"type:json;not null" json:"tags"`
	Color        string     `gorm:"size:16;default:#0A84FF" json:"color"`
	Status       string     `gorm:"size:32;default:开发中" json:"status"`
	Stars        int        `gorm:"default:0" json:"stars"`
	PreviewURL   *string    `gorm:"size:500" json:"preview_url"`
	IsFeatured   int8       `gorm:"default:1" json:"is_featured"` // 合并默认值为1
	DisplayOrder int        `gorm:"default:0" json:"display_order"`
	LastSyncedAt *time.Time `json:"last_synced_at"`
	CreatedAt    time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

func (Work) TableName() string { return "works" }
