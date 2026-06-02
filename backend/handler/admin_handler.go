// handler/admin_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"open-source-club-nav/backend/utils"
	"os"
	"runtime"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetAdminMe 获取当前登录管理员信息（GET /api/admin/me）
func GetAdminMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userId":   user.ID,
		"username": user.Username,
		"role":     user.Role,
	})
}

// AdminLogout 管理员登出（POST /api/admin/logout）
func AdminLogout(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusOK, gin.H{"ok": true})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	db.Model(&model.User{}).Where("id = ?", userID).Update("session", "")

	// 清除 Cookie
	c.SetCookie("kcos_admin_session", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetAdminLogs 获取操作日志（GET /api/admin/logs）
func GetAdminLogs(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit > 200 {
		limit = 200
	}

	var logs []model.NavItemLog
	var total int64

	db.Model(&model.NavItemLog{}).Count(&total)
	db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&logs)

	c.JSON(http.StatusOK, gin.H{"logs": logs, "total": total})
}

// GetAdminSystem 获取系统运行状态（GET /api/admin/system）
func GetAdminSystem(c *gin.Context) {
	hostname, _ := os.Hostname()
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	c.JSON(http.StatusOK, gin.H{
		"now":        time.Now().Format(time.RFC3339),
		"hostname":   hostname,
		"goVersion":  runtime.Version(),
		"goroutines": runtime.NumGoroutine(),
		"memoryMB":   memStats.Alloc / 1024 / 1024,
		"status":     "ok",
	})
}

// GetAdminUsers 获取管理员用户列表（GET /api/admin/users）
func GetAdminUsers(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var users []model.User
	if err := db.Where("role IN ?", []string{"super", "editor"}).
		Select("id, username, role, email, status, last_login_at, created_at").
		Order("id ASC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

// CreateAdminUser 创建管理员用户（POST /api/admin/users）
func CreateAdminUser(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role" binding:"required"`
		Email    string `json:"email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数不完整"})
		return
	}

	if input.Role != "super" && input.Role != "editor" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "角色必须是 super 或 editor"})
		return
	}

	// 检查用户名是否已存在
	var count int64
	db.Model(&model.User{}).Where("username = ?", input.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
		return
	}

	passwordHash, err := utils.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "密码哈希失败"})
		return
	}

	user := model.User{
		Username:     input.Username,
		PasswordHash: passwordHash,
		Role:         input.Role,
		Email:        input.Email,
		Status:       1,
	}
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user": gin.H{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"email":    user.Email,
	}})
}

// DeleteAdminUser 删除管理员用户（DELETE /api/admin/users/:id）
func DeleteAdminUser(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	// 不允许删除自己
	userID, _ := c.Get("userID")
	if strconv.FormatUint(uint64(userID.(uint)), 10) == id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能删除自己"})
		return
	}

	result := db.Where("id = ? AND role IN ?", id, []string{"super", "editor"}).Delete(&model.User{})
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetLinkHealth 获取链接健康检查结果（GET /api/admin/link-health）
func GetLinkHealth(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 200 {
		limit = 200
	}

	var healthChecks []model.NavItemHealth
	db.Order("checked_at DESC").Limit(limit).Find(&healthChecks)

	c.JSON(http.StatusOK, gin.H{"health": healthChecks})
}

// CheckLinkHealth 触发链接健康检查（POST /api/admin/link-health）
func CheckLinkHealth(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// 获取所有活跃的 nav_items
	type NavItemBasic struct {
		ID  uint
		URL string
	}
	var items []NavItemBasic
	db.Raw("SELECT id, link_url AS url FROM nav_items WHERE active = 1 AND link_url != ''").Scan(&items)

	checked := 0
	client := &http.Client{Timeout: 5 * time.Second}

	for _, item := range items {
		if item.URL == "" {
			continue
		}

		isOK := true
		statusCode := 0
		var responseTimeMs int
		var message string

		start := time.Now()
		resp, err := client.Head(item.URL)
		responseTimeMs = int(time.Since(start).Milliseconds())

		if err != nil {
			isOK = false
			message = err.Error()
			if len(message) > 255 {
				message = message[:255]
			}
		} else {
			statusCode = resp.StatusCode
			resp.Body.Close()
			if resp.StatusCode >= 400 {
				isOK = false
				message = resp.Status
			}
		}

		now := time.Now()
		health := model.NavItemHealth{
			NavItemID:      item.ID,
			URL:            item.URL,
			StatusCode:     &statusCode,
			IsOK:           isOK,
			CheckedAt:      now,
			Message:        &message,
			ResponseTimeMs: &responseTimeMs,
		}

		db.Save(&health)
		checked++
	}

	c.JSON(http.StatusOK, gin.H{"checked": checked, "total": len(items)})
}

// GetLoginAuditLogs 获取登录审计日志（GET /api/admin/login-audit）
func GetLoginAuditLogs(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 200 {
		limit = 200
	}

	var logs []model.LoginAudit
	db.Order("created_at DESC").Limit(limit).Find(&logs)

	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
