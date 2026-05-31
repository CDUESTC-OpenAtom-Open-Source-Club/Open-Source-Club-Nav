package handler

import (
	"net/http"
	"open-source-club-nav/backend/middleware"
	"open-source-club-nav/backend/model"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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

	// 2. 从数据库获取管理员用户（校验role为super）
	db := c.MustGet("db").(*gorm.DB)
	var user model.User
	if err := db.Where("email = ? AND role = ?", req.Username, "super").First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"err": "管理员账号不存在"})
		return
	}

	// 3. 校验密码（bcrypt解密）
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"err": "密码错误"})
		return
	}

	// 4. 签发管理员Cookie（或JWT）
	// 生成session
	session := middleware.GenerateAdminSession(user.ID)
	// 关键：把session写入admin表的session字段
	if err := db.Model(&user).Update("session", session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"err": "Session写入失败"})
		return
	}
	// 设置Cookie
	c.SetCookie("kcos_admin_session", session, 3600, "/", "localhost", false, true)

	// 5. 返回成功响应
	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "管理员登录成功",
		"data": gin.H{
			"username": user.Username,
			"role":     user.Role,
		},
	})
}
