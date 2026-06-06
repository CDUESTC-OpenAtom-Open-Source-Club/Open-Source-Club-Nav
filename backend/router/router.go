package router

import (
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"
	"open-source-club-nav/backend/utils"
	"strings"

	"go.uber.org/zap"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func InitRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()
	logger := utils.InitLogger()
	defer utils.SyncLogger(logger)

	// 全局中间件
	r.Use(middleware.InjectDB(db, logger))
	r.Use(initCors(cfg))

	// Swagger
	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// 拆分路由：分别调用不同的注册函数
	registerPublicRoutes(r.Group("/api"), logger)
	registerBaseRoutes(r.Group(""), logger)
	registerAdminRoutes(r.Group("/api/admin"))
	registerMetricsRoutes(r.Group("/api/metrics"))

	return r
}

// 1. 初始化CORS（拆分独立函数）
func initCors(cfg *config.Config) gin.HandlerFunc {
	corsOrigins := strings.Split(cfg.CORS.AllowedOrigins, ",")
	return cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cookie", "X-CSRF-Token"},
		AllowCredentials: true,
	})
}

// 3. 基础端点路由（拆分）
func registerBaseRoutes(g *gin.RouterGroup, logger *zap.Logger) {
	g.POST("/register", handler.RegisterHandler(logger))
	g.POST("/login", handler.LoginHandler(logger))
	g.GET("/healthz", handler.HealthzHandler)
}

// 4. 后台接口路由（拆分，包含鉴权）
func registerAdminRoutes(g *gin.RouterGroup) {
	// 登录接口（无需鉴权）
	g.POST("/login", handler.AdminLoginHandler)

	// 鉴权后的后台子路由
	authG := g.Group("")
	authG.Use(middleware.SignAuth())
	{
		// 个人信息
		authG.GET("/me", handler.GetAdminMe)
		authG.POST("/logout", handler.AdminLogout)

		// 文章子路由（继续拆分）
		registerArticleRoutes(authG.Group("/articles"))
		// 作品子路由
		registerWorkRoutes(authG.Group("/works"))

		// 其他后台功能
		authG.GET("/stats", handler.GetAdminStats)
		authG.GET("/logs", handler.GetAdminLogs)
		authG.GET("/system", handler.GetAdminSystem)
		authG.GET("/link-health", handler.GetLinkHealth)
		authG.POST("/link-health", handler.CheckLinkHealth)
		authG.GET("/login-audit", handler.GetLoginAuditLogs)

		// 超级管理员子路由
		registerSuperAdminRoutes(authG.Group(""))
		// 资源/内容子路由
		registerResourceRoutes(authG)
	}
}

// 4.1 文章子路由（更细粒度拆分）
func registerArticleRoutes(g *gin.RouterGroup) {
	g.POST("", handler.CreateArticle)
	g.GET("/:id", handler.GetArticle)
	g.PUT("/:id", handler.UpdateArticle)
	g.DELETE("/:id", handler.DeleteArticle)
	g.GET("", handler.ListArticles)
}

// 4.2 作品子路由（更细粒度拆分）
func registerWorkRoutes(g *gin.RouterGroup) {
	g.GET("", handler.GetAllWorks)
	g.POST("", handler.CreateWork)
	g.DELETE("/:id", handler.DeleteWork)
	g.PATCH("/:id", handler.UpdateWork)
	g.POST("/sync", handler.SyncGitHubWorks)
}

// 4.3 超级管理员子路由
func registerSuperAdminRoutes(g *gin.RouterGroup) {
	superG := g.Group("")
	superG.Use(handler.RequireRole("super"))
	{
		superG.GET("/users", handler.GetAdminUsers)
		superG.POST("/users", handler.CreateAdminUser)
		superG.DELETE("/users/:id", handler.DeleteAdminUser)
	}
}

// 4.4 资源/内容子路由
func registerResourceRoutes(g *gin.RouterGroup) {
	// 链接
	g.POST("/links", handler.CreateFriendLink)
	g.PUT("/links/:id", handler.UpdateFriendLink)
	// 资源矩阵
	g.POST("/resources", handler.CreateResourceMatrix)
	g.PUT("/resources/:id", handler.UpdateResourceMatrix)
	g.DELETE("/resources/:id", handler.DeleteResourceMatrix)
	// 小游戏
	g.POST("/games", handler.CreateMiniGame)
	g.PUT("/games/:id", handler.UpdateMiniGame)
	// 内容
	contentG := g.Group("/content")
	contentG.Use(handler.RequireRole("editor", "super"))
	{
		contentG.GET("", handler.GetContentByType)
		contentG.POST("", handler.CreateContent)
		contentG.PUT("/:id", handler.UpdateContent)
		contentG.DELETE("/:id", handler.DeleteContent)
	}
}

// 5. 统计接口路由（拆分）
func registerMetricsRoutes(g *gin.RouterGroup) {
	g.POST("/visit", handler.RecordVisit)
	g.POST("/click", handler.RecordClick)
}
