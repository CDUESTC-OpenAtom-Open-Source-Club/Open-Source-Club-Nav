// router/router.go
package router

import (
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// router/router.go
// 初始化路由（传入数据库连接，后续注入到Context）
func InitRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 1. 注入DB到Context（全局中间件，所有接口都能拿到DB）
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// 2. Swagger路由（非生产环境开放）
	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// -------------------------- 公共接口（不需要鉴权） --------------------------
	publicGroup := r.Group("/")
	{
		// 这里放不需要鉴权的接口，比如注册、登录
		publicGroup.POST("/register", handler.RegisterHandler)
		publicGroup.POST("/login", handler.LoginHandler)
	}

	// -------------------------- 私有接口（需要鉴权） --------------------------
	privateGroup := r.Group("/")
	privateGroup.Use(middleware.SignAuth()) // 只给私有接口加鉴权
	{
		// 新增管理员列表接口路由

		privateGroup.GET("/backend/admin/list", handler.GetAdminListHandler)
	}

	return r
}
