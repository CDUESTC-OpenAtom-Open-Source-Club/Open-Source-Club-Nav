package router

import (
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"
	"time"

	"github.com/gin-gonic/gin"
)

// registerPrivateRoutes 迁移原adminGroup的后台接口
func registerPrivateRoutes(g *gin.RouterGroup) {
	// 后台接口统一鉴权
	g.Use(middleware.SignAuth())

	// 后台登录接口（限流：1分钟最多3次）
	g.POST("/login", handler.RateLimit(3, time.Minute), handler.AdminLoginHandler)

	// 作品删除接口
	g.DELETE("/works/:id", handler.DeleteArticle)

	// 文章管理子路由组
	adminArticleGroup := g.Group("/articles")
	{
		adminArticleGroup.POST("", handler.CreateArticle)
		adminArticleGroup.GET("/:id", handler.GetArticle)
		adminArticleGroup.PUT("/:id", handler.UpdateArticle)
		adminArticleGroup.DELETE("/:id", handler.DeleteArticle)
		adminArticleGroup.GET("", handler.ListArticles)
	}
}
