// router/router.go
package router

import (
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"

	"github.com/gin-contrib/cors" // 要先导入这个包

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// router/router.go
// 初始化路由（传入数据库连接，后续注入到Context）
func InitRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// ========== 在这里添加CORS中间件 ==========

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4000"}, // 替换为你的Next前端域名
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cookie"},
		AllowCredentials: true, // 允许携带Cookie
	}))

	// 1. 注入DB到Context
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// 2. Swagger路由（原有代码）
	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// 3. 公共接口（不需要鉴权）
	publicGroup := r.Group("")
	{
		publicGroup.POST("/register", handler.RegisterHandler)
		publicGroup.POST("/login", handler.LoginHandler)
		// 导航项+关联业务数据的接口（URL对应之前的配置）
		publicGroup.GET("/api/nav/:id", handler.GetNavWithBusiness)
		// 资源矩阵公开查询接口
		publicGroup.GET("/api/resources", handler.SearchResourceMatrix)
		// 小游戏公开查询接口
		publicGroup.GET("/api/games", handler.SearchMiniGame)
		// 官网文章公开查询接口
		publicGroup.GET("/api/articles", handler.SearchArticle)
	}
	// ========== 新增：后台管理接口组 ==========
	adminGroup := r.Group("/api/admin") // 路径前缀：/api/admin
	{
		// 后台登录接口（绑定你要写的AdminLoginHandler）
		adminGroup.POST("/login", handler.AdminLoginHandler)
		// 后续可添加其他后台接口，比如/admin/me、/admin/users等
		adminGroup.DELETE("/works/:id", middleware.SignAuth(), handler.DeleteArticle)
		// 给adminArticleGroup加自己的大括号
		adminArticleGroup := adminGroup.Group("/articles")
		{ // adminArticleGroup的大括号
			adminArticleGroup.POST("", middleware.SignAuth(), handler.CreateArticle)
			adminArticleGroup.GET("/:id", middleware.SignAuth(), handler.GetArticle)
			adminArticleGroup.PUT("/:id", middleware.SignAuth(), handler.UpdateArticle)
			adminArticleGroup.DELETE("/:id", middleware.SignAuth(), handler.DeleteArticle)
			adminArticleGroup.GET("", middleware.SignAuth(), handler.ListArticles)
		} // adminArticleGroup的大括号结束

	}

	// 4. 私有接口（需要鉴权）
	privateGroup := r.Group("")
	privateGroup.Use(middleware.SignAuth())
	{
		// 友情链接后台接口组
		adminLinkGroup := privateGroup.Group("/api/admin/links")
		{
			adminLinkGroup.POST("", handler.CreateFriendLink)
			adminLinkGroup.PUT("/:id", handler.UpdateFriendLink)
		}
		// 资源矩阵后台接口组
		adminResourceGroup := privateGroup.Group("/api/admin/resources")
		{
			adminResourceGroup.POST("", handler.CreateResourceMatrix)    // 新增资源
			adminResourceGroup.PUT("/:id", handler.UpdateResourceMatrix) // 编辑资源
		}
		// 小游戏后台接口组
		adminGameGroup := privateGroup.Group("/api/admin/games")
		{
			adminGameGroup.POST("", handler.CreateMiniGame)    // 新增小游戏
			adminGameGroup.PUT("/:id", handler.UpdateMiniGame) // 编辑小游戏
		}

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
