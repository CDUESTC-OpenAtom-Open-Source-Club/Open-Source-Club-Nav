// handler/metrics_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RecordVisit 记录页面访问（POST /api/metrics/visit）
func RecordVisit(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		VisitorID string `json:"visitor_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少 visitor_id"})
		return
	}

	visitorID := input.VisitorID
	if len(visitorID) > 64 {
		visitorID = visitorID[:64]
	}

	// 更新 daily_stats.page_views（MySQL UPSERT）
	db.Exec(`INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks)
		VALUES (CURDATE(), 1, 0, 0)
		ON DUPLICATE KEY UPDATE page_views = page_views + 1`)

	// 写入 metrics 记录
	db.Create(&model.Metric{
		EventType: "visit",
		VisitorID: &visitorID,
	})

	// 尝试写入 daily_visits（去重，MySQL INSERT IGNORE）
	result := db.Exec("INSERT IGNORE INTO daily_visits (stat_date, visitor_id) VALUES (CURDATE(), ?)", visitorID)
	newVisitor := result.RowsAffected > 0

	if newVisitor {
		db.Exec(`INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks)
			VALUES (CURDATE(), 0, 1, 0)
			ON DUPLICATE KEY UPDATE unique_visitors = unique_visitors + 1`)
	}

	c.JSON(http.StatusOK, gin.H{"newVisitor": newVisitor})
}

// RecordClick 记录点击事件（POST /api/metrics/click）
func RecordClick(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		NavItemID     *uint   `json:"nav_item_id"`
		VisitorID     *string `json:"visitor_id"`
		PagePath      *string `json:"page_path"`
		Referrer      *string `json:"referrer"`
		UserAgent     *string `json:"user_agent"`
		TargetURL     *string `json:"target_url"`
		TargetLabel   *string `json:"target_label"`
		SourceContext  *string `json:"source_context"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体解析失败"})
		return
	}

	// 更新 daily_stats.link_clicks（MySQL UPSERT）
	db.Exec(`INSERT INTO daily_stats (stat_date, page_views, unique_visitors, link_clicks)
		VALUES (CURDATE(), 0, 0, 1)
		ON DUPLICATE KEY UPDATE link_clicks = link_clicks + 1`)

	// 写入 metrics 记录
	metric := model.Metric{
		EventType:     "click",
		NavItemID:     input.NavItemID,
		TargetURL:     input.TargetURL,
		TargetLabel:   input.TargetLabel,
		SourceContext:  input.SourceContext,
		VisitorID:     input.VisitorID,
		PagePath:      input.PagePath,
		Referrer:      input.Referrer,
		UserAgent:     input.UserAgent,
	}
	db.Create(&metric)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
