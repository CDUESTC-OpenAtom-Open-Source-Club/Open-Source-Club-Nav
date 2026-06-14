// handler/admin_handler.go
package handler

import (
	"bufio"
	"encoding/json"
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

type linkHealthResult struct {
	ID                uint      `json:"id"`
	LinkID            uint      `json:"link_id"`
	Title             string    `json:"title"`
	URL               string    `json:"url"`
	StatusCode        *int      `json:"status_code"`
	IsOK              bool      `json:"is_ok"`
	Message           *string   `json:"message"`
	CheckedAt         time.Time `json:"checked_at"`
	Module            string    `json:"module"`
	ResourceSubModule *string   `json:"resource_sub_module"`
}

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
			"rxBytes":    rxBytes,
			"txBytes":    txBytes,
			"totalBytes": totalBytes,
			"sampledAt":  now.Format(time.RFC3339),
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

	columns := []string{"action", "actor_username", "actor_role", "detail", "created_at"}
	placeholders := []string{"?", "?", "?", "?", "?"}
	args := []interface{}{action, uname, r, nullableString(detail), time.Now()}

	if tableHasColumn(db, "nav_item_logs", "actor_user_id") {
		columns = append(columns, "actor_user_id")
		placeholders = append(placeholders, "?")
		args = append(args, uid)
	}
	if tableHasColumn(db, "nav_item_logs", "nav_item_id") {
		columns = append(columns, "nav_item_id")
		placeholders = append(placeholders, "?")
		args = append(args, nullableUint(navItemID))
	} else if tableHasColumn(db, "nav_item_logs", "link_id") {
		columns = append(columns, "link_id")
		placeholders = append(placeholders, "?")
		args = append(args, nullableUint(navItemID))
	}

	sql := fmt.Sprintf("INSERT INTO nav_item_logs (%s) VALUES (%s)", strings.Join(columns, ", "), strings.Join(placeholders, ", "))
	if err := db.Exec(sql, args...).Error; err != nil {
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

	linkColumn := healthLinkColumn(db)
	hasID := healthTableHasColumn(db, "id")
	hasTitle := healthTableHasColumn(db, "title")
	idSelect := "0 AS id"
	if hasID {
		idSelect = "h.id"
	}
	titleSelect := "n.title AS title"
	if hasTitle {
		titleSelect = "COALESCE(NULLIF(h.title, ''), n.title) AS title"
	}

	where := ""
	if strings.EqualFold(strings.TrimSpace(c.Query("status")), "failed") {
		where = "AND h.is_ok = 0"
	}

	var healthChecks []linkHealthResult
	query := fmt.Sprintf(`
SELECT
  %s,
  h.%s AS link_id,
  %s,
  n.link_url AS url,
  h.status_code,
  h.is_ok,
  h.message,
  h.checked_at,
  n.content_type AS module,
  n.sub_type AS resource_sub_module
FROM nav_item_health h
JOIN nav_items n ON n.id = h.%s
WHERE n.content_type IN ('resource_matrix', 'friend_links', 'mini_games')
%s
ORDER BY h.checked_at DESC
LIMIT ?
`, idSelect, linkColumn, titleSelect, linkColumn, where)

	if err := db.Raw(query, limit).Scan(&healthChecks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "加载健康检测失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"health": healthChecks})
}

// CheckLinkHealth 触发链接健康检查（POST /api/admin/link-health）
func CheckLinkHealth(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// 获取所有活跃的 nav_items
	type NavItemBasic struct {
		ID    uint
		Title string
		URL   string
	}
	var items []NavItemBasic
	db.Raw(`
SELECT id, title, link_url AS url
FROM nav_items
WHERE active = 1
  AND content_type IN ('resource_matrix', 'friend_links', 'mini_games')
  AND TRIM(link_url) != ''
  AND TRIM(link_url) != '#'
ORDER BY id ASC
`).Scan(&items)

	checked := 0
	failed := 0
	skipped := 0
	client := &http.Client{Timeout: 5 * time.Second}
	linkColumn := healthLinkColumn(db)
	forceCheck := strings.EqualFold(c.Query("force"), "1") || strings.EqualFold(c.Query("force"), "true")
	healthCacheTTL := envDuration("LINK_HEALTH_CACHE_TTL", 24*time.Hour)
	cleanupStaleLinkHealth(db, linkColumn)
	healthColumns := map[string]bool{
		"title":            healthTableHasColumn(db, "title"),
		"url":              healthTableHasColumn(db, "url"),
		"response_time_ms": healthTableHasColumn(db, "response_time_ms"),
	}

	for _, item := range items {
		if item.URL == "" {
			continue
		}
		if !forceCheck && healthCacheTTL > 0 && hasRecentLinkHealth(db, linkColumn, item.ID, healthCacheTTL) {
			skipped++
			continue
		}

		start := time.Now()
		isOK, statusCode, message := probeLink(client, item.URL)
		responseTimeMs := int(time.Since(start).Milliseconds())
		if !isOK {
			failed++
		}

		now := time.Now()
		if err := upsertLinkHealth(db, linkColumn, healthColumns, item.ID, item.Title, item.URL, statusCode, isOK, message, responseTimeMs, now); err != nil {
			utils.Logger.Warn("写入链接健康状态失败", zap.Uint("link_id", item.ID), zap.Error(err))
		}
		checked++
	}

	detailBytes, _ := json.Marshal(gin.H{
		"checked": checked,
		"failed":  failed,
		"skipped": skipped,
		"total":   len(items),
		"reason":  "manual_probe",
	})
	logAction(db, c, "check_health", nil, string(detailBytes))

	c.JSON(http.StatusOK, gin.H{"checked": checked, "failed": failed, "skipped": skipped, "total": len(items)})
}

// CheckSingleLinkHealth 检查单个链接的健康状态（POST /api/admin/link-health/:id）
func CheckSingleLinkHealth(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	idStr := c.Param("id")
	linkID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的链接ID"})
		return
	}

	// 获取链接信息
	type NavItemBasic struct {
		ID                uint
		Title             string
		URL               string
		Module            string
		ResourceSubModule *string `gorm:"column:resource_sub_module"`
	}
	var item NavItemBasic
	if err := db.Raw(`
SELECT id, title, link_url AS url, content_type AS module, NULLIF(sub_type, '') AS resource_sub_module
FROM nav_items
WHERE id = ? AND active = 1
  AND content_type IN ('resource_matrix', 'friend_links', 'mini_games')
  AND TRIM(link_url) != ''
  AND TRIM(link_url) != '#'
`, linkID).Scan(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "链接不存在或已禁用"})
		return
	}

	if item.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "链接URL为空"})
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	linkColumn := healthLinkColumn(db)
	healthColumns := map[string]bool{
		"title":            healthTableHasColumn(db, "title"),
		"url":              healthTableHasColumn(db, "url"),
		"response_time_ms": healthTableHasColumn(db, "response_time_ms"),
	}

	start := time.Now()
	isOK, statusCode, message := probeLink(client, item.URL)
	responseTimeMs := int(time.Since(start).Milliseconds())

	now := time.Now()
	if err := upsertLinkHealth(db, linkColumn, healthColumns, item.ID, item.Title, item.URL, statusCode, isOK, message, responseTimeMs, now); err != nil {
		utils.Logger.Warn("写入链接健康状态失败", zap.Uint("link_id", item.ID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "写入健康状态失败"})
		return
	}

	detailBytes, _ := json.Marshal(gin.H{
		"link_id":          item.ID,
		"title":            item.Title,
		"url":              item.URL,
		"is_ok":            isOK,
		"status_code":      statusCode,
		"message":          message,
		"response_time_ms": responseTimeMs,
		"reason":           "single_probe",
	})
	logAction(db, c, "check_health", &item.ID, string(detailBytes))

	failed := 0
	if !isOK {
		failed = 1
	}
	healthMessage := message
	c.JSON(http.StatusOK, gin.H{
		"checked": 1,
		"failed":  failed,
		"skipped": 0,
		"total":   1,
		"health": linkHealthResult{
			LinkID:            item.ID,
			Title:             item.Title,
			URL:               item.URL,
			StatusCode:        statusCode,
			IsOK:              isOK,
			Message:           &healthMessage,
			CheckedAt:         now,
			Module:            item.Module,
			ResourceSubModule: item.ResourceSubModule,
		},
	})
}

func healthTableHasColumn(db *gorm.DB, columnName string) bool {
	return tableHasColumn(db, "nav_item_health", columnName)
}

func tableHasColumn(db *gorm.DB, tableName string, columnName string) bool {
	var count int64
	if err := db.Raw(`
SELECT COUNT(*)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = ?
  AND COLUMN_NAME = ?
`, tableName, columnName).Scan(&count).Error; err != nil {
		return false
	}
	return count > 0
}

func healthLinkColumn(db *gorm.DB) string {
	if healthTableHasColumn(db, "link_id") {
		return "link_id"
	}
	return "nav_item_id"
}

func hasRecentLinkHealth(db *gorm.DB, linkColumn string, linkID uint, ttl time.Duration) bool {
	var count int64
	cutoff := time.Now().Add(-ttl)
	query := fmt.Sprintf("%s = ? AND checked_at >= ?", linkColumn)
	if err := db.Table("nav_item_health").Where(query, linkID, cutoff).Count(&count).Error; err != nil {
		return false
	}
	return count > 0
}

func probeLink(client *http.Client, targetURL string) (bool, *int, string) {
	statusCode, statusText, err := requestLink(client, http.MethodHead, targetURL)
	if err == nil && statusCode != nil && (*statusCode == http.StatusForbidden || *statusCode == http.StatusMethodNotAllowed) {
		statusCode, statusText, err = requestLink(client, http.MethodGet, targetURL)
	}
	if err != nil {
		return false, nil, truncateHealthMessage(err.Error())
	}
	if statusCode == nil {
		return false, nil, "未返回 HTTP 状态"
	}
	if *statusCode >= 400 {
		return false, statusCode, truncateHealthMessage(statusText)
	}
	return true, statusCode, "OK"
}

func requestLink(client *http.Client, method string, targetURL string) (*int, string, error) {
	req, err := http.NewRequest(method, targetURL, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("User-Agent", "OpenAtomClubNav-LinkHealth/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	statusCode := resp.StatusCode
	return &statusCode, resp.Status, nil
}

func truncateHealthMessage(message string) string {
	const maxLength = 500
	message = strings.TrimSpace(message)
	if len(message) <= maxLength {
		return message
	}
	return message[:maxLength]
}

func upsertLinkHealth(
	db *gorm.DB,
	linkColumn string,
	healthColumns map[string]bool,
	linkID uint,
	title string,
	targetURL string,
	statusCode *int,
	isOK bool,
	message string,
	responseTimeMs int,
	checkedAt time.Time,
) error {
	setClauses := []string{"status_code = ?", "is_ok = ?", "message = ?", "checked_at = ?"}
	args := []interface{}{nullableInt(statusCode), boolToInt(isOK), message, checkedAt}
	if healthColumns["title"] {
		setClauses = append(setClauses, "title = ?")
		args = append(args, title)
	}
	if healthColumns["url"] {
		setClauses = append(setClauses, "url = ?")
		args = append(args, targetURL)
	}
	if healthColumns["response_time_ms"] {
		setClauses = append(setClauses, "response_time_ms = ?")
		args = append(args, responseTimeMs)
	}
	args = append(args, linkID)

	updateSQL := fmt.Sprintf("UPDATE nav_item_health SET %s WHERE %s = ?", strings.Join(setClauses, ", "), linkColumn)
	result := db.Exec(updateSQL, args...)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected > 0 {
		return nil
	}

	columns := []string{linkColumn, "status_code", "is_ok", "message", "checked_at"}
	placeholders := []string{"?", "?", "?", "?", "?"}
	insertArgs := []interface{}{linkID, nullableInt(statusCode), boolToInt(isOK), message, checkedAt}
	if healthColumns["title"] {
		columns = append(columns, "title")
		placeholders = append(placeholders, "?")
		insertArgs = append(insertArgs, title)
	}
	if healthColumns["url"] {
		columns = append(columns, "url")
		placeholders = append(placeholders, "?")
		insertArgs = append(insertArgs, targetURL)
	}
	if healthColumns["response_time_ms"] {
		columns = append(columns, "response_time_ms")
		placeholders = append(placeholders, "?")
		insertArgs = append(insertArgs, responseTimeMs)
	}

	insertSQL := fmt.Sprintf("INSERT INTO nav_item_health (%s) VALUES (%s)", strings.Join(columns, ", "), strings.Join(placeholders, ", "))
	return db.Exec(insertSQL, insertArgs...).Error
}

func cleanupStaleLinkHealth(db *gorm.DB, linkColumn string) {
	sql := fmt.Sprintf(`
DELETE h
FROM nav_item_health h
LEFT JOIN nav_items n ON n.id = h.%s
WHERE n.id IS NULL
   OR n.active != 1
   OR n.content_type NOT IN ('resource_matrix', 'friend_links', 'mini_games')
   OR TRIM(n.link_url) = ''
   OR TRIM(n.link_url) = '#'
`, linkColumn)
	if err := db.Exec(sql).Error; err != nil {
		utils.Logger.Warn("清理过期链接健康状态失败", zap.Error(err))
	}
}

func nullableInt(value *int) interface{} {
	if value == nil {
		return nil
	}
	return *value
}

func nullableUint(value *uint) interface{} {
	if value == nil {
		return nil
	}
	return *value
}

func nullableString(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
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
