// model/friend_links.go
package model

import "time"

// FriendLink 对应数据库中的friend_links表
type FriendLink struct {
	ID        uint      `gorm:"primaryKey"`
	Title     string    `gorm:"column:title"`    // 链接名称
	LinkUrl   string    `gorm:"column:link_url"` // 链接地址
	Sort      int       `gorm:"column:sort"`     // 排序
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

// TableName 指定对应的数据库表名（修正这里的方法定义）
func (f FriendLink) TableName() string {
	return "friend_links"
}
