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
		CAST(strftime('%H', created_at) AS INTEGER) AS hour,
		SUM(CASE WHEN event_type = 'visit' THEN 1 ELSE 0 END) AS page_views,
		COUNT(DISTINCT CASE WHEN event_type = 'visit' THEN visitor_id ELSE NULL END) AS unique_visitors,
		SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS link_clicks
		FROM metrics
		WHERE created_at >= date('now') AND created_at < date('now', '+1 day')
		GROUP BY hour
		ORDER BY hour ASC`).Scan(&hourlyRows)

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

	// 3. 热门仓库点击 Top5
	type PopularRow struct {
		Repo     string `json:"repo"`
		URL      string `json:"url"`
		Clicks   int    `json:"clicks"`
	}
	var popularRows []PopularRow
	db.Raw(`SELECT
		COALESCE(n.title, m.target_label, m.target_url, 'item#' || COALESCE(m.nav_item_id, 0)) AS repo,
		COALESCE(n.link_url, m.target_url, '') AS url,
		COUNT(*) AS clicks
		FROM metrics m
		LEFT JOIN nav_items n ON m.nav_item_id = n.id
		WHERE m.created_at >= datetime('now', '-30 days')
			AND m.event_type = 'click'
			AND (m.source_context LIKE 'works-carousel:%' OR m.source_context = 'github-work')
			AND COALESCE(m.target_url, '') LIKE 'https://github.com/%'
		GROUP BY m.nav_item_id, repo, url
		ORDER BY clicks DESC LIMIT 5`).Scan(&popularRows)

	// 4. 热门仓库7天趋势
	type TrendRow struct {
		StatDate string `json:"stat_date"`
		Clicks   int    `json:"clicks"`
	}

	type PopularWithTrend struct {
		Repo   string     `json:"repo"`
		URL    string     `json:"url"`
		Clicks int        `json:"clicks"`
		Trend7 []TrendRow `json:"trend7"`
	}

	popularRepos := make([]PopularWithTrend, 0, len(popularRows))
	for _, p := range popularRows {
		var trendRows []TrendRow
		db.Raw(`SELECT date(created_at) AS stat_date, COUNT(*) AS clicks
			FROM metrics
			WHERE event_type = 'click'
				AND COALESCE(target_url, '') = ?
				AND created_at >= date('now', '-6 days')
				AND (source_context LIKE 'works-carousel:%' OR source_context = 'github-work')
			GROUP BY date(created_at)
			ORDER BY stat_date ASC`, p.URL).Scan(&trendRows)

		trendMap := make(map[string]int)
		for _, t := range trendRows {
			trendMap[t.StatDate] = t.Clicks
		}

		trend7 := make([]TrendRow, 7)
		for i := 0; i < 7; i++ {
			date := time.Now().AddDate(0, 0, -(6 - i))
			key := date.Format("2006-01-02")
			trend7[i] = TrendRow{StatDate: key, Clicks: trendMap[key]}
		}

		popularRepos = append(popularRepos, PopularWithTrend{
			Repo:   p.Repo,
			URL:    p.URL,
			Clicks: p.Clicks,
			Trend7: trend7,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"today":            today,
		"days":             days,
		"trend7":           trend7,
		"hourly24":         hourly24,
		"popularRepos":     popularRepos,
		"popularCategories": popularRepos,
	})
}
