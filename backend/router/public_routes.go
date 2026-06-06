package router

import (
	"open-source-club-nav/backend/handler"
	"time"

	"go.uber.org/zap" // 导入zap包

	"github.com/gin-gonic/gin"
)

// 1. 给registerPublicRoutes添加logger参数
func registerPublicRoutes(g *gin.RouterGroup, logger *zap.Logger) { // 新增logger参数
	// 2. 注册RegisterHandler时传入logger
	g.POST("/register", handler.RateLimit(5, time.Minute), handler.RegisterHandler(logger))
	g.POST("/login", handler.RateLimit(10, time.Minute), handler.LoginHandler(logger)) // LoginHandler后续也需要同理修改

	// 导航/资源等接口（保持不变）
	g.GET("/nav/:id", handler.GetNavWithBusiness)
	g.GET("/resources", handler.SearchResourceMatrix)
	g.GET("/games", handler.SearchMiniGame)
	g.GET("/articles", handler.SearchArticle)
}
