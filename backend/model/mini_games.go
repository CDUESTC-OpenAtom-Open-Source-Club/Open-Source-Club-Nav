package model

import "gorm.io/gorm"

type MiniGame struct {
	gorm.Model
	GameType string `json:"game_type" gorm:"size:50;not null"`
	Name     string `json:"name" gorm:"size:100;not null;unique"`
	CoverUrl string `json:"cover_url" gorm:"size:255"`
	PlayUrl  string `json:"play_url" gorm:"size:255;not null"`
	Status   int    `json:"status" gorm:"default:1"` // 1=上线，0=下线
	Sort     int    `json:"sort" gorm:"default:0"`
}

// 指定表名
func (MiniGame) TableName() string {
	return "mini_games"
}
