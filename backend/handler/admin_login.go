package handler

import (
	"net/http"
	"open-source-club-nav/backend/middleware"
	"open-source-club-nav/backend/model"
	"open-source-club-nav/backend/utils"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// @Summary 管理员登录
// @Description 后台管理员账号登录，签发Cookie
// @Tags 后台管理
// @Accept json
// @Produce json
// @Param req body struct{Username string;Password string} true "登录参数"
// @Success 200 {object} struct{Code int;Msg string;Data struct{Username string;Role string}}
// @Failure 400 {object} struct{Err string}
// @Failure 401 {object} struct{Err string}
// @Router /api/admin/login [post]
func AdminLoginHandler(c *gin.Context) {
	// 1. 绑定请求参数
	type LoginReq struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"err": "参数错误"})
		return
	}

	// 2. 从数据库获取管理员用户（支持 username 或 email 登录，角色为 super 或 editor）
	db := c.MustGet("db").(*gorm.DB)
	var user model.User
	if err := db.Where("(username = ? OR email = ?) AND role IN ?", req.Username, req.Username, []string{"super", "editor"}).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"err": "账号不存在或无权限"})
		return
	}

	// 3. 校验密码（兼容 scrypt 和 bcrypt）
	ok, legacy := utils.VerifyPassword(req.Password, user.PasswordHash)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"err": "密码错误"})
		return
	}

	// 如果是旧 bcrypt 哈希，登录成功后自动升级为 scrypt
	if legacy {
		newHash, err := utils.HashPassword(req.Password)
		if err == nil {
			db.Model(&user).Update("password_hash", newHash)
		}
	}

	// 4. 签发管理员 Cookie
	session := middleware.GenerateAdminSession(user.ID)
	if err := db.Model(&user).Update("session", session).Error; err != nil {
		utils.Logger.Error("Session写入失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"err": "Session写入失败"})
		return
	}

	// 更新最后登录信息
	db.Model(&user).Updates(map[string]interface{}{
		"last_login_at":  gorm.Expr("CURRENT_TIMESTAMP"),
		"last_login_ip":  c.ClientIP(),
	})

	// 记录登录审计
	db.Create(&model.LoginAudit{
		Username:   user.Username,
		RemoteAddr: c.ClientIP(),
		UserAgent:  c.GetHeader("User-Agent"),
		Success:    true,
		Reason:     "登录成功",
	})

	// 设置 Cookie（不绑定特定域名，支持跨域场景）
	c.SetCookie("kcos_admin_session", session, 86400*7, "/", "", false, true)

	// 5. 返回成功响应
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "登录成功",
		"data": gin.H{
			"userId":   user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}
