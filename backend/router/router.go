package router

import (
	"strings"
	"time"

	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"
	"open-source-club-nav/backend/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func InitRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()
	logger := utils.InitLogger()
	defer utils.SyncLogger(logger)

	r.Use(middleware.InjectDB(db, logger))
	r.Use(initCors(cfg))

	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	registerBaseRoutes(r.Group(""), logger)
	registerLegacyRoutes(r.Group(""), logger)
	registerAPIRoutes(r, "/api", logger)
	registerAPIRoutes(r, "/api/v1", logger)

	return r
}

func initCors(cfg *config.Config) gin.HandlerFunc {
	allowedOrigins := "http://localhost:4000"
	if cfg != nil && strings.TrimSpace(cfg.CORS.AllowedOrigins) != "" {
		allowedOrigins = cfg.CORS.AllowedOrigins
	}

	return cors.New(cors.Config{
		AllowOrigins:     splitCSV(allowedOrigins),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cookie", "X-CSRF-Token"},
		AllowCredentials: true,
	})
}

func registerBaseRoutes(g *gin.RouterGroup, logger *zap.Logger) {
	g.POST("/register", handler.RateLimit(10, time.Minute), handler.RegisterHandler(logger))
	g.POST("/login", handler.RateLimit(20, time.Minute), handler.LoginHandler(logger))
	g.GET("/healthz", handler.HealthzHandler)
}

func registerLegacyRoutes(g *gin.RouterGroup, logger *zap.Logger) {
	g.GET("/nav/search", handler.SearchNavItem)

	backendGroup := g.Group("/backend")
	backendGroup.Use(handler.AuthMiddleware(logger))
	backendGroup.Use(handler.RequireRole("super"))
	{
		backendGroup.GET("/admin/list", handler.GetAdminListHandler(logger))
	}
}

func registerAPIRoutes(r *gin.Engine, apiPrefix string, logger *zap.Logger) {
	publicGroup := r.Group(apiPrefix)
	{
		publicGroup.POST("/register", handler.RateLimit(10, time.Minute), handler.RegisterHandler(logger))
		publicGroup.POST("/login", handler.RateLimit(20, time.Minute), handler.LoginHandler(logger))
		publicGroup.GET("/healthz", handler.HealthzHandler)
		publicGroup.GET("/nav/:id", handler.GetNavWithBusiness)
		publicGroup.GET("/resources", handler.SearchResourceMatrix)
		publicGroup.GET("/games", handler.SearchMiniGame)
		publicGroup.GET("/articles", handler.SearchArticle)
		publicGroup.GET("/links", handler.SearchNavItem)
		publicGroup.GET("/works", handler.GetPublicWorks)
		publicGroup.GET("/works/:id", handler.GetWorkByID)
		publicGroup.GET("/content", handler.GetContentByType)
		publicGroup.GET("/activities", handler.GetActivities)
		publicGroup.GET("/org-stats", handler.GetOrgStats)
		publicGroup.GET("/github-users", handler.GetGitHubUsers)
		publicGroup.GET("/github-contributors", handler.GetGitHubContributors)
		publicGroup.GET("/system", handler.GetPublicSystem)
	}

	registerAdminRoutes(r.Group(apiPrefix + "/admin"))
	registerMetricsRoutes(r.Group(apiPrefix + "/metrics"))
}

func registerAdminRoutes(g *gin.RouterGroup) {
	g.POST("/login", handler.RateLimit(3, time.Minute), handler.AdminLoginHandler)

	authG := g.Group("")
	authG.Use(middleware.SignAuth())
	{
		authG.GET("/me", handler.GetAdminMe)
		authG.POST("/logout", handler.AdminLogout)

		registerArticleRoutes(authG.Group("/articles"))
		registerWorkRoutes(authG.Group("/works"))

		authG.GET("/stats", handler.GetAdminStats)
		authG.GET("/logs", handler.GetAdminLogs)
		authG.GET("/system", handler.GetAdminSystem)
		authG.GET("/link-health", handler.GetLinkHealth)
		authG.POST("/link-health", handler.CheckLinkHealth)
		authG.GET("/login-audit", handler.GetLoginAuditLogs)

		registerSuperAdminRoutes(authG.Group(""))
		registerResourceRoutes(authG)
	}
}

func registerArticleRoutes(g *gin.RouterGroup) {
	g.POST("", handler.CreateArticle)
	g.GET("/:id", handler.GetArticle)
	g.PUT("/:id", handler.UpdateArticle)
	g.DELETE("/:id", handler.DeleteArticle)
	g.GET("", handler.ListArticles)
}

func registerWorkRoutes(g *gin.RouterGroup) {
	g.GET("", handler.GetAllWorks)
	g.POST("", handler.CreateWork)
	g.DELETE("/:id", handler.DeleteWork)
	g.PATCH("/:id", handler.UpdateWork)
	g.POST("/sync", handler.SyncGitHubWorks)
}

func registerSuperAdminRoutes(g *gin.RouterGroup) {
	superG := g.Group("")
	superG.Use(handler.RequireRole("super"))
	{
		superG.GET("/users", handler.GetAdminUsers)
		superG.POST("/users", handler.CreateAdminUser)
		superG.DELETE("/users/:id", handler.DeleteAdminUser)
	}
}

func registerResourceRoutes(g *gin.RouterGroup) {
	g.POST("/links", handler.CreateFriendLink)
	g.PUT("/links/:id", handler.UpdateFriendLink)
	g.POST("/resources", handler.CreateResourceMatrix)
	g.PUT("/resources/:id", handler.UpdateResourceMatrix)

	g.DELETE("/resources/:id", handler.DeleteResourceMatrix)
	// 小游戏
	g.POST("/games", handler.CreateMiniGame)
	g.PUT("/games/:id", handler.UpdateMiniGame)

	contentG := g.Group("/content")
	contentG.Use(handler.RequireRole("editor", "super"))
	{
		contentG.GET("", handler.GetContentByType)
		contentG.POST("", handler.CreateContent)
		contentG.PUT("/:id", handler.UpdateContent)
		contentG.DELETE("/:id", handler.DeleteContent)
	}
}

func registerMetricsRoutes(g *gin.RouterGroup) {
	g.POST("/visit", handler.RecordVisit)
	g.POST("/click", handler.RecordClick)
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	items := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			items = append(items, trimmed)
		}
	}
	return items
}
