package router

import (
	"time"

	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func InitRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cookie"},
		AllowCredentials: true,
	}))

	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// Keep existing non-versioned auth and health endpoints.
	publicGroup := r.Group("")
	publicGroup.POST("/register", handler.RateLimit(10, time.Minute), handler.RegisterHandler)
	publicGroup.POST("/login", handler.RateLimit(20, time.Minute), handler.LoginHandler)
	publicGroup.GET("/healthz", handler.HealthzHandler)

	// Legacy endpoints kept for compatibility with main.
	publicGroup.GET("/nav/search", handler.SearchNavItem)
	backendGroup := r.Group("/backend")
	backendGroup.Use(handler.AuthMiddleware())
	backendGroup.Use(handler.RequireRole("super"))
	{
		backendGroup.GET("/admin/list", handler.GetAdminListHandler)
	}

	// Dual stack: keep /api and add /api/v1.
	registerAPIRoutes(r, "/api")
	registerAPIRoutes(r, "/api/v1")

	return r
}

func registerAPIRoutes(r *gin.Engine, apiPrefix string) {
	publicGroup := r.Group(apiPrefix)
	{
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
		publicGroup.GET("/healthz", handler.HealthzHandler)
	}

	adminGroup := r.Group(apiPrefix + "/admin")
	{
		adminGroup.POST("/login", handler.AdminLoginHandler)
	}

	authGroup := r.Group(apiPrefix + "/admin")
	authGroup.Use(middleware.SignAuth())
	{
		authGroup.GET("/me", handler.GetAdminMe)
		authGroup.POST("/logout", handler.AdminLogout)

		articleGroup := authGroup.Group("/articles")
		{
			articleGroup.POST("", handler.CreateArticle)
			articleGroup.GET("/:id", handler.GetArticle)
			articleGroup.PUT("/:id", handler.UpdateArticle)
			articleGroup.DELETE("/:id", handler.DeleteArticle)
			articleGroup.GET("", handler.ListArticles)
		}

		worksGroup := authGroup.Group("/works")
		{
			worksGroup.GET("", handler.GetAllWorks)
			worksGroup.POST("", handler.CreateWork)
			worksGroup.DELETE("/:id", handler.DeleteWork)
		}

		authGroup.POST("/works/sync", handler.SyncGitHubWorks)
		authGroup.PATCH("/works/:id", handler.UpdateWork)
		authGroup.GET("/stats", handler.GetAdminStats)
		authGroup.GET("/logs", handler.GetAdminLogs)
		authGroup.GET("/system", handler.GetAdminSystem)
		authGroup.GET("/link-health", handler.GetLinkHealth)
		authGroup.POST("/link-health", handler.CheckLinkHealth)
		authGroup.GET("/login-audit", handler.GetLoginAuditLogs)
		authGroup.GET("/users", handler.RequireRole("super"), handler.GetAdminUsers)
		authGroup.POST("/users", handler.RequireRole("super"), handler.CreateAdminUser)
		authGroup.DELETE("/users/:id", handler.RequireRole("super"), handler.DeleteAdminUser)
	}

	privateGroup := r.Group("")
	privateGroup.Use(middleware.SignAuth())
	{
		adminLinkGroup := privateGroup.Group(apiPrefix + "/admin/links")
		{
			adminLinkGroup.POST("", handler.CreateFriendLink)
			adminLinkGroup.PUT("/:id", handler.UpdateFriendLink)
		}

		adminResourceGroup := privateGroup.Group(apiPrefix + "/admin/resources")
		{
			adminResourceGroup.POST("", handler.CreateResourceMatrix)
			adminResourceGroup.PUT("/:id", handler.UpdateResourceMatrix)
		}

		adminGameGroup := privateGroup.Group(apiPrefix + "/admin/games")
		{
			adminGameGroup.POST("", handler.CreateMiniGame)
			adminGameGroup.PUT("/:id", handler.UpdateMiniGame)
		}

		contentGroup := privateGroup.Group(apiPrefix + "/content")
		contentGroup.Use(handler.RequireRole("editor", "super"))
		{
			contentGroup.POST("", handler.CreateContent)
			contentGroup.PUT("/:id", handler.UpdateContent)
			contentGroup.DELETE("/:id", handler.DeleteContent)
			contentGroup.PUT("/:id/toggle", handler.ToggleContentActive)
		}
	}

	metricsGroup := r.Group(apiPrefix + "/metrics")
	{
		metricsGroup.POST("/visit", handler.RecordVisit)
		metricsGroup.POST("/click", handler.RecordClick)
	}
}
