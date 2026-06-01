// model/metrics.go
package model

import "time"

// Metric 事件埋点模型，对应 metrics 表。
type Metric struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	EventType    string    `gorm:"size:16;not null" json:"event_type"`
	NavItemID    *uint     `json:"nav_item_id"`
	TargetURL    *string   `gorm:"size:500" json:"target_url"`
	TargetLabel  *string   `gorm:"size:255" json:"target_label"`
	SourceContext *string  `gorm:"size:128" json:"source_context"`
	VisitorID    *string   `gorm:"size:64" json:"visitor_id"`
	PagePath     *string   `gorm:"size:255" json:"page_path"`
	Referrer     *string   `gorm:"size:500" json:"referrer"`
	UserAgent    *string   `gorm:"size:255" json:"user_agent"`
	IPHash       *string   `gorm:"size:64" json:"ip_hash"`
	CreatedAt    time.Time `gorm:"autoCreateTime;index" json:"created_at"`
}

func (Metric) TableName() string { return "metrics" }

// DailyStat 每日统计模型，对应 daily_stats 表。
type DailyStat struct {
	StatDate        time.Time `gorm:"primaryKey" json:"stat_date"`
	PageViews       int       `gorm:"default:0" json:"page_views"`
	UniqueVisitors  int       `gorm:"default:0" json:"unique_visitors"`
	LinkClicks      int       `gorm:"default:0" json:"link_clicks"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (DailyStat) TableName() string { return "daily_stats" }

// DailyVisit 每日访客去重模型，对应 daily_visits 表。
type DailyVisit struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	StatDate   time.Time `gorm:"not null" json:"stat_date"`
	VisitorID  string    `gorm:"size:64;not null" json:"visitor_id"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (DailyVisit) TableName() string { return "daily_visits" }

// NavItemLog 导航项操作审计模型，对应 nav_item_logs 表。
type NavItemLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	NavItemID     *uint     `json:"nav_item_id"`
	Action        string    `gorm:"size:32;not null" json:"action"`
	ActorUserID   uint      `gorm:"not null" json:"actor_user_id"`
	ActorUsername string    `gorm:"size:64;not null" json:"actor_username"`
	ActorRole     string    `gorm:"size:32;not null" json:"actor_role"`
	Detail        *string   `gorm:"type:json" json:"detail"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (NavItemLog) TableName() string { return "nav_item_logs" }

// NavItemHealth 链接健康检查模型，对应 nav_item_health 表。
type NavItemHealth struct {
	NavItemID      uint      `gorm:"primaryKey" json:"nav_item_id"`
	URL            string    `gorm:"size:500;not null" json:"url"`
	StatusCode     *int      `json:"status_code"`
	IsOK           bool      `gorm:"default:true" json:"is_ok"`
	CheckedAt      time.Time `gorm:"autoUpdateTime" json:"checked_at"`
	Message        *string   `gorm:"size:255" json:"message"`
	ResponseTimeMs *int      `json:"response_time_ms"`
}

func (NavItemHealth) TableName() string { return "nav_item_health" }

// LoginAudit 登录审计模型，对应 login_audit 表。
type LoginAudit struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Username    string    `gorm:"size:64;not null" json:"username"`
	RemoteAddr  string    `gorm:"size:45;default:''" json:"remote_addr"`
	UserAgent   string    `gorm:"size:255;default:''" json:"user_agent"`
	Success     bool      `gorm:"default:false" json:"success"`
	Reason      string    `gorm:"size:64;default:''" json:"reason"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (LoginAudit) TableName() string { return "login_audit" }
