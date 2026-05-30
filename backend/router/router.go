// router/router.go
package router

import (
	"time"

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
		// 注册、登录（各自独立的 IP 限流桶）
		publicGroup.POST("/register", handler.RateLimit(10, time.Minute), handler.RegisterHandler)
		publicGroup.POST("/login", handler.RateLimit(20, time.Minute), handler.LoginHandler)
		// 导航搜索
		publicGroup.GET("/nav/search", handler.SearchNavItem)
		// 健康检查（Docker/负载均衡器探活）
		publicGroup.GET("/healthz", handler.HealthzHandler)
		// 公开内容接口（用于前端展示）
		publicGroup.GET("/api/content", handler.GetContentByType)
	}

	// -------------------------- 私有接口（需要鉴权） --------------------------
	privateGroup := r.Group("/")
	privateGroup.Use(middleware.SignAuth()) // JWT 统一鉴权
	{
		// 内容管理接口（editor/super 权限）
		contentGroup := privateGroup.Group("/api/content")
		contentGroup.Use(handler.RequireRole("editor", "super"))
		{
			contentGroup.POST("", handler.CreateContent)
			contentGroup.PUT("/:id", handler.UpdateContent)
			contentGroup.DELETE("/:id", handler.DeleteContent)
			contentGroup.PUT("/:id/toggle", handler.ToggleContentActive)
		}

		// 管理员列表接口（super 权限）
		privateGroup.GET("/backend/admin/list", handler.RequireRole("super"), handler.GetAdminListHandler)
	}

	return r
}
