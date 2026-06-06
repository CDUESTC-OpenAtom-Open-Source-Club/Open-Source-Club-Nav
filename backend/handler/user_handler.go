package handler

import (
	"net/http"
	"open-source-club-nav/backend/middleware" // 假设你已经定义了middleware
	"open-source-club-nav/backend/service"
	"open-source-club-nav/backend/utils" // 假设你已经定义了utils

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// 注意：这里的RegisterRequest和LoginRequest可以统一放到model/dto里，避免重复
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6,max=256"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterHandler 只处理HTTP请求，业务逻辑交给service

func RegisterHandler(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 直接用service的RegisterRequest类型
		var req service.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			logger.Warn("注册参数错误", zap.Error(err))
			c.JSON(http.StatusBadRequest, gin.H{"msg": "参数错误: " + err.Error()})
			return
		}

		gormDB := middleware.GetDB(c)
		userService := service.NewUserService(gormDB)
		// 这里直接传req（已经是service.RegisterRequest类型）
		if err := userService.Register(req); err != nil {
			c.JSON(utils.ErrStatusCode(err), gin.H{"msg": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"msg": "注册成功"})
	}
}

// 给LoginHandler添加logger参数
func LoginHandler(logger *zap.Logger) gin.HandlerFunc { // 新增logger参数
	return func(c *gin.Context) { // 这里的c是gin.Context
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			// 替换utils.Logger为注入的logger
			logger.Warn("登录参数错误", zap.Error(err))
			// 替换为统一的APIError响应
			c.JSON(http.StatusBadRequest, &utils.APIError{
				Code:    http.StatusBadRequest,
				Message: "参数错误",
			})
			return
		}

		// 初始化service（原逻辑保留）
		dbVal, ok := c.Get("db")
		if !ok {
			c.JSON(http.StatusInternalServerError, &utils.APIError{
				Code:    http.StatusInternalServerError,
				Message: "数据库未初始化",
			})
			return
		}
		gormDB, ok := dbVal.(*gorm.DB)
		if !ok {
			c.JSON(http.StatusInternalServerError, &utils.APIError{
				Code:    http.StatusInternalServerError,
				Message: "数据库连接类型错误",
			})
			return
		}
		userService := service.NewUserService(gormDB)

		// 调用service的登录方法（注意：变量名从token改成session）
		session, err := userService.Login(service.LoginRequest(req))
		if err != nil {
			// 用utils的ErrStatusCode获取错误对应的HTTP状态码
			c.JSON(utils.ErrStatusCode(err), err)
			return
		}

		// ========== 新增：设置Session到Cookie ==========
		c.SetCookie(
			"kcos_user_session", // Cookie名（区分普通用户）
			session,             // service返回的安全Session
			86400,               // 过期时间：24小时（秒）
			"/",                 // 全站可用
			"",                  // 域名（留空为当前域名）
			false,               // Secure：本地开发用false，HTTPS环境改true
			true,                // HttpOnly：防止XSS攻击
		)
		// ========== Cookie设置结束 ==========

		// 替换原有的"token"响应，改为统一的APIResponse
		c.JSON(http.StatusOK, &utils.APIResponse{
			Code:    0,
			Message: "登录成功",
		})
	} // 补全这个闭合的}，之前可能漏了
}

func GetAdminListHandler(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		dbval, ok := c.Get("db")
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"msg": "数据库未初始化"})
			return
		}
		gormDB, ok := dbval.(*gorm.DB)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"msg": "数据库连接类型错误"})
			return
		}
		userService := service.NewUserService(gormDB)
		admins, err := userService.GetAdminList()
		if err != nil {
			logger.Warn("获取管理员列表失败", zap.Error(err))
			c.JSON(utils.ErrStatusCode(err), gin.H{"msg": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": admins})
	}
}
