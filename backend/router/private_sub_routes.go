package router

import (
	"open-source-club-nav/backend/handler"
	"open-source-club-nav/backend/middleware"
	"open-source-club-nav/backend/utils"

	"github.com/gin-gonic/gin"
)

// registerPrivateSubRoutes 迁移privateGroup下的子路由组
func registerPrivateSubRoutes(g *gin.RouterGroup) {
	// 私有接口统一鉴权
	g.Use(middleware.SignAuth())

	// 1. 友情链接后台接口组
	adminLinkGroup := g.Group("/api/admin/links")
	{
		adminLinkGroup.POST("", handler.CreateFriendLink)
		adminLinkGroup.PUT("/:id", handler.UpdateFriendLink)
	}

	// 2. 资源矩阵后台接口组
	adminResourceGroup := g.Group("/api/admin/resources")
	{
		adminResourceGroup.POST("", handler.CreateResourceMatrix)
		adminResourceGroup.PUT("/:id", handler.UpdateResourceMatrix)
	}

	// 3. 小游戏后台接口组
	adminGameGroup := g.Group("/api/admin/games")
	{
		adminGameGroup.POST("", handler.CreateMiniGame)
		adminGameGroup.PUT("/:id", handler.UpdateMiniGame)
	}

	// 4. 内容管理接口组（叠加角色权限）
	contentGroup := g.Group("/api/content")
	contentGroup.Use(handler.RequireRole("editor", "super")) // 后续把RequireRole迁移到middleware
	{
		contentGroup.POST("", handler.CreateContent)
		contentGroup.PUT("/:id", handler.UpdateContent)
		contentGroup.DELETE("/:id", handler.DeleteContent)
		contentGroup.PUT("/:id/toggle", handler.ToggleContentActive)
	}
	// 5. 管理员列表接口（super权限）
	g.GET("/backend/admin/list", handler.RequireRole("super"), handler.GetAdminListHandler(utils.Logger))

}
