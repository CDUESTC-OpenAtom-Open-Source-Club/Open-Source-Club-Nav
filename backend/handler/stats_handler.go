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

	today := DailyRow{}
	if len(dailyRows) > 0 {
		today = dailyRows[0]
	} else {
		today.StatDate = time.Now().Format("2006-01-02")
	}

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

	c.JSON(http.StatusOK, gin.H{
		"today":    today,
		"days":     days,
		"trend7":   trend7,
		"hourly24": hourly24,
	})
}
