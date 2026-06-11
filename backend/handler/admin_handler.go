// handler/admin_handler.go
package handler

import (
	"bufio"
	"fmt"
	"net/http"
	"open-source-club-nav/backend/model"
	"open-source-club-nav/backend/utils"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
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
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
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
// 从 Linux /proc 文件系统读取真实系统指标
func GetAdminSystem(c *gin.Context) {
	hostname, _ := os.Hostname()
	now := time.Now()
	uptimeSec := int(now.Unix() - bootTimeUnix())

	cpuCores := runtime.NumCPU()

	memTotal, memAvail := readMemInfo()
	var memUsageRate float64
	if memTotal > 0 {
		memUsageRate = float64(memTotal-memAvail) / float64(memTotal) * 100
	}

	rxBytes, txBytes := readNetDev()
	totalBytes := rxBytes + txBytes

	c.JSON(http.StatusOK, gin.H{
		"uptimeSec": uptimeSec,
		"cpuCores":  cpuCores,
		"mem": gin.H{
			"usageRate": round2(memUsageRate),
		},
		"network": gin.H{
			"rxBytes":   rxBytes,
			"txBytes":   txBytes,
			"totalBytes": totalBytes,
			"sampledAt": now.Format(time.RFC3339),
		},
		"hostname":  hostname,
		"goVersion": runtime.Version(),
		"status":    "ok",
	})
}

// bootTimeUnix 从 /proc/uptime 读取系统启动至今的秒数，反算启动时间戳
func bootTimeUnix() int64 {
	f, err := os.Open("/proc/uptime")
	if err != nil {
		return time.Now().Unix()
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	if scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) > 0 {
			uptimeSec, err := strconv.ParseFloat(fields[0], 64)
			if err == nil {
				return time.Now().Add(-time.Duration(uptimeSec * float64(time.Second))).Unix()
			}
		}
	}
	return time.Now().Unix()
}

// readMemInfo 从 /proc/meminfo 读取 MemTotal 和 MemAvailable（单位 kB）
func readMemInfo() (memTotal int64, memAvail int64) {
	f, err := os.Open("/proc/meminfo")
	if err != nil {
		return 0, 0
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "MemTotal:") {
			memTotal = parseMemInfoValue(line)
		} else if strings.HasPrefix(line, "MemAvailable:") {
			memAvail = parseMemInfoValue(line)
		}
		if memTotal > 0 && memAvail > 0 {
			break
		}
	}
	return
}

// parseMemInfoValue 解析 /proc/meminfo 行中的数值（去掉单位 "kB"）
// 例: "MemTotal:       16384000 kB" => 16384000
func parseMemInfoValue(line string) int64 {
	parts := strings.Fields(line)
	if len(parts) >= 2 {
		val, err := strconv.ParseInt(parts[1], 10, 64)
		if err == nil {
			return val
		}
	}
	return 0
}

// readNetDev 从 /proc/net/dev 读取所有非 lo 接口的 rx/tx 字节数
func readNetDev() (rxBytes int64, txBytes int64) {
	f, err := os.Open("/proc/net/dev")
	if err != nil {
		return 0, 0
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		if lineNum <= 2 {
			continue // 跳过前两行表头
		}
		line := scanner.Text()
		colonIdx := strings.Index(line, ":")
		if colonIdx < 0 {
			continue
		}
		iface := strings.TrimSpace(line[:colonIdx])
		if iface == "lo" {
			continue // 跳过回环接口
		}
		rest := strings.Fields(line[colonIdx+1:])
		if len(rest) >= 10 {
			if v, err := strconv.ParseInt(rest[0], 10, 64); err == nil {
				rxBytes += v
			}
			if v, err := strconv.ParseInt(rest[8], 10, 64); err == nil {
				txBytes += v
			}
		}
	}
	return
}

// round2 四舍五入到两位小数
func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
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

	logAction(db, c, "create_user", nil, "新增用户: "+user.Username)

	c.JSON(http.StatusCreated, gin.H{"user": gin.H{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"email":    user.Email,
	}})
}

// DeleteAdminUser 删除管理员用户（DELETE /api/admin/users/:id 或 ?id=X）
func DeleteAdminUser(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")
	if id == "" {
		id = c.Query("id")
	}
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少用户 ID"})
		return
	}

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

	logAction(db, c, "delete_user", nil, "删除用户 ID: "+id)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// UpdateAdminUser 更新管理员用户（PUT /api/admin/users）
func UpdateAdminUser(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		ID       uint    `json:"id" binding:"required"`
		Username *string `json:"username"`
		Password *string `json:"password"`
		Role     *string `json:"role"`
		Email    *string `json:"email"`
		Status   *int    `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数不完整"})
		return
	}

	var user model.User
	if err := db.First(&user, input.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	// 不允许修改自己的角色
	currentUserID, _ := c.Get("userID")
	if user.ID == currentUserID.(uint) && input.Role != nil && *input.Role != user.Role {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能修改自己的角色"})
		return
	}

	updates := make(map[string]interface{})

	if input.Username != nil && *input.Username != "" && *input.Username != user.Username {
		var count int64
		db.Model(&model.User{}).Where("username = ? AND id != ?", *input.Username, input.ID).Count(&count)
		if count > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
			return
		}
		updates["username"] = *input.Username
	}

	if input.Role != nil {
		if *input.Role != "super" && *input.Role != "editor" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "角色必须是 super 或 editor"})
			return
		}
		updates["role"] = *input.Role
	}

	if input.Email != nil {
		updates["email"] = *input.Email
	}

	if input.Status != nil {
		updates["status"] = *input.Status
	}

	if input.Password != nil && *input.Password != "" {
		passwordHash, err := utils.HashPassword(*input.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "密码哈希失败"})
			return
		}
		updates["password_hash"] = passwordHash
		now := time.Now()
		updates["password_changed_at"] = &now
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有需要更新的字段"})
		return
	}

	if err := db.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	logAction(db, c, "update_user", nil, fmt.Sprintf("更新用户 %s", user.Username))

	db.First(&user, input.ID)
	c.JSON(http.StatusOK, gin.H{"user": gin.H{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"email":    user.Email,
		"status":   user.Status,
	}})
}

// logAction 记录操作日志到 nav_item_logs 表
func logAction(db *gorm.DB, c *gin.Context, action string, navItemID *uint, detail string) {
	userID, _ := c.Get("userID")
	username, _ := c.Get("username")
	role, _ := c.Get("role")

	uid, _ := userID.(uint)
	uname, _ := username.(string)
	r, _ := role.(string)

	log := model.NavItemLog{
		NavItemID:     navItemID,
		Action:        action,
		ActorUserID:   uid,
		ActorUsername: uname,
		ActorRole:     r,
		CreatedAt:     time.Now(),
	}
	if detail != "" {
		d := detail
		log.Detail = &d
	}

	if err := db.Create(&log).Error; err != nil {
		utils.Logger.Warn("写入操作日志失败", zap.Error(err))
	}
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
