// router/router.go
package router

import (
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// InitRouter 初始化路由（传入数据库连接，后续注入到Context）
func InitRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// CORS 中间件
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cookie"},
		AllowCredentials: true,
	}))

	// 注入 DB 到 Context
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// Swagger 路由
	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// ==================== 公共接口（不需要鉴权） ====================
	publicGroup := r.Group("")
	{
		// 用户注册/登录（JWT）
		publicGroup.POST("/register", handler.RegisterHandler)
		publicGroup.POST("/login", handler.LoginHandler)

		// 健康检查
		publicGroup.GET("/healthz", handler.HealthzHandler)

		// 导航项+关联业务数据
		publicGroup.GET("/api/nav/:id", handler.GetNavWithBusiness)

		// 资源矩阵 / 小游戏 / 文章 公开查询
		publicGroup.GET("/api/resources", handler.SearchResourceMatrix)
		publicGroup.GET("/api/games", handler.SearchMiniGame)
		publicGroup.GET("/api/articles", handler.SearchArticle)

		// 导航项搜索（已实现但之前未注册）
		publicGroup.GET("/api/links", handler.SearchNavItem)

		// 作品公开查询
		publicGroup.GET("/api/works", handler.GetPublicWorks)
		publicGroup.GET("/api/works/:id", handler.GetWorkByID)

		// 内容公开查询
		publicGroup.GET("/api/content", handler.GetContentByType)
	}

	// ==================== 管理员登录（不需要鉴权） ====================
	adminGroup := r.Group("/api/admin")
	{
		adminGroup.POST("/login", handler.AdminLoginHandler)
	}

	// ==================== 管理接口（需要 SignAuth 鉴权） ====================
	authGroup := r.Group("/api/admin")
	authGroup.Use(middleware.SignAuth())
	{
		// 管理员会话管理
		authGroup.GET("/me", handler.GetAdminMe)
		authGroup.POST("/logout", handler.AdminLogout)

		// 文章管理
		articleGroup := authGroup.Group("/articles")
		{
			articleGroup.POST("", handler.CreateArticle)
			articleGroup.GET("/:id", handler.GetArticle)
			articleGroup.PUT("/:id", handler.UpdateArticle)
			articleGroup.DELETE("/:id", handler.DeleteArticle)
			articleGroup.GET("", handler.ListArticles)
		}

		// 作品管理
		worksGroup := authGroup.Group("/works")
		{
			worksGroup.GET("", handler.GetAllWorks)
			worksGroup.POST("", handler.CreateWork)
			worksGroup.DELETE("/:id", handler.DeleteWork)
		}

		// 作品同步（GitHub）
		authGroup.POST("/works/sync", handler.SyncGitHubWorks)

		// 单个作品更新（PATCH）
		authGroup.PATCH("/works/:id", handler.UpdateWork)

		// 统计数据
		authGroup.GET("/stats", handler.GetAdminStats)

		// 操作日志
		authGroup.GET("/logs", handler.GetAdminLogs)

		// 系统信息
		authGroup.GET("/system", handler.GetAdminSystem)

		// 链接健康检查
		authGroup.GET("/link-health", handler.GetLinkHealth)
		authGroup.POST("/link-health", handler.CheckLinkHealth)

		// 登录审计
		authGroup.GET("/login-audit", handler.GetLoginAuditLogs)

		// 用户管理（super 权限）
		authGroup.GET("/users", handler.RequireRole("super"), handler.GetAdminUsers)
		authGroup.POST("/users", handler.RequireRole("super"), handler.CreateAdminUser)
		authGroup.DELETE("/users/:id", handler.RequireRole("super"), handler.DeleteAdminUser)
	}

	// ==================== 友链/资源/小游戏管理（需要 SignAuth） ====================
	privateGroup := r.Group("")
	privateGroup.Use(middleware.SignAuth())
	{
		// 友情链接
		adminLinkGroup := privateGroup.Group("/api/admin/links")
		{
			adminLinkGroup.POST("", handler.CreateFriendLink)
			adminLinkGroup.PUT("/:id", handler.UpdateFriendLink)
		}

		// 资源矩阵
		adminResourceGroup := privateGroup.Group("/api/admin/resources")
		{
			adminResourceGroup.POST("", handler.CreateResourceMatrix)
			adminResourceGroup.PUT("/:id", handler.UpdateResourceMatrix)
		}

		// 小游戏
		adminGameGroup := privateGroup.Group("/api/admin/games")
		{
			adminGameGroup.POST("", handler.CreateMiniGame)
			adminGameGroup.PUT("/:id", handler.UpdateMiniGame)
		}

		// 内容管理（editor/super 权限）
		contentGroup := privateGroup.Group("/api/content")
		contentGroup.Use(handler.RequireRole("editor", "super"))
		{
			contentGroup.POST("", handler.CreateContent)
			contentGroup.PUT("/:id", handler.UpdateContent)
			contentGroup.DELETE("/:id", handler.DeleteContent)
			contentGroup.PUT("/:id/toggle", handler.ToggleContentActive)
		}
	}

	// ==================== 公共埋点接口（不需要鉴权） ====================
	metricsGroup := r.Group("/api/metrics")
	{
		metricsGroup.POST("/visit", handler.RecordVisit)
		metricsGroup.POST("/click", handler.RecordClick)
	}

	return r
}
