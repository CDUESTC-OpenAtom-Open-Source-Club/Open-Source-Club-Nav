// handler/stats_handler.go
package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetAdminStats 获取后台统计数据（GET /api/admin/stats）
func GetAdminStats(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	now := time.Now()

	// 1. 最近30天每日统计
	type DailyRow struct {
		StatDate       string `json:"stat_date"`
		PageViews      int    `json:"page_views"`
		UniqueVisitors int    `json:"unique_visitors"`
		LinkClicks     int    `json:"link_clicks"`
	}
	var dailyRows []DailyRow
	db.Raw(`SELECT stat_date, page_views, unique_visitors, link_clicks
		FROM daily_stats ORDER BY stat_date DESC LIMIT 30`).Scan(&dailyRows)

	today := DailyRow{StatDate: now.Format("2006-01-02")}
	db.Raw(`SELECT
		DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS stat_date,
		COALESCE(SUM(CASE WHEN event_type = 'visit' THEN 1 ELSE 0 END), 0) AS page_views,
		COUNT(DISTINCT CASE WHEN event_type = 'visit' THEN visitor_id ELSE NULL END) AS unique_visitors,
		COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) AS link_clicks
		FROM metrics
		WHERE created_at >= CURDATE() AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`).Scan(&today)

	// 反转为正序
	days := make([]DailyRow, len(dailyRows))
	copy(days, dailyRows)
	for i, j := 0, len(days)-1; i < j; i, j = i+1, j-1 {
		days[i], days[j] = days[j], days[i]
	}
	trend7 := days
	if len(trend7) > 7 {
		trend7 = days[len(days)-7:]
	}

	// 2. 今日24小时分布
	type HourlyRow struct {
		Hour           int `json:"hour"`
		PageViews      int `json:"page_views"`
		UniqueVisitors int `json:"unique_visitors"`
		LinkClicks     int `json:"link_clicks"`
	}
	var hourlyRows []HourlyRow
	db.Raw(`SELECT
		HOUR(created_at) AS hour,
		SUM(CASE WHEN event_type = 'visit' THEN 1 ELSE 0 END) AS page_views,
		COUNT(DISTINCT CASE WHEN event_type = 'visit' THEN visitor_id ELSE NULL END) AS unique_visitors,
		SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS link_clicks
		FROM metrics
		WHERE created_at >= CURDATE() AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
		GROUP BY HOUR(created_at)
		ORDER BY HOUR(created_at) ASC`).Scan(&hourlyRows)

	hourlyMap := make(map[int]HourlyRow)
	for _, r := range hourlyRows {
		hourlyMap[r.Hour] = r
	}
	hourly24 := make([]HourlyRow, 24)
	for h := 0; h < 24; h++ {
		if r, ok := hourlyMap[h]; ok {
			hourly24[h] = r
		} else {
			hourly24[h] = HourlyRow{Hour: h}
		}
	}

	// 3. 今日点击排行，用于后台首页快速判断用户实际点击对象
	type TopClickRow struct {
		LinkID            uint    `json:"link_id"`
		Title             string  `json:"title"`
		URL               string  `json:"url"`
		Module            string  `json:"module"`
		ResourceSubModule *string `json:"resource_sub_module"`
		Clicks            int     `json:"clicks"`
	}
	var topClicks []TopClickRow
	db.Raw(`SELECT
		COALESCE(m.nav_item_id, 0) AS link_id,
		COALESCE(NULLIF(n.title, ''), NULLIF(m.target_label, ''), '未命名链接') AS title,
		COALESCE(NULLIF(n.link_url, ''), NULLIF(m.target_url, ''), '') AS url,
		COALESCE(n.content_type, '') AS module,
		NULLIF(n.sub_type, '') AS resource_sub_module,
		COUNT(*) AS clicks
		FROM metrics m
		LEFT JOIN nav_items n ON n.id = m.nav_item_id
		WHERE m.event_type = 'click'
		  AND m.created_at >= CURDATE()
		  AND m.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
		GROUP BY m.nav_item_id, n.title, m.target_label, n.link_url, m.target_url, n.content_type, n.sub_type
		ORDER BY clicks DESC
		LIMIT 5`).Scan(&topClicks)

	c.JSON(http.StatusOK, gin.H{
		"today":     today,
		"days":      days,
		"trend7":    trend7,
		"hourly24":  hourly24,
		"topClicks": topClicks,
		"source": gin.H{
			"type":      "database",
			"today":     "metrics",
			"hourly24":  "metrics",
			"topClicks": "metrics + nav_items",
			"days":      "daily_stats",
			"sampledAt": now.Format(time.RFC3339),
		},
	})
}
