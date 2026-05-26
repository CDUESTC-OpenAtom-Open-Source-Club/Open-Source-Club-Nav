// router/router.go
package router

import (
	"net/http"                             // 导入日志工具
	"open-source-club-nav/backend/handler" // 导入handler里的接口

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// router/router.go
// 初始化路由（传入数据库连接，后续注入到Context）
func InitRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 1. 注入DB到Context（让handler能拿到数据库连接）
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// 2. 原main.go里的swagger路由
	r.GET("/debug/pprof/*any", gin.WrapH(http.DefaultServeMux))
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 3. 原main.go里的“公开接口”
	r.POST("/register", handler.RegisterHandler) // 关联handler里的注册接口
	r.POST("/login", handler.LoginHandler)       // 关联handler里的登录接口
	r.GET("/nav/search", handler.SearchNavItem)  // 关联handler里的导航搜索接口

	// 4. 原main.go里的“管理员接口（带权限）”
	backendGroup := r.Group("/backend")
	backendGroup.Use(handler.AuthMiddleware()) // 权限中间件（要移到handler里）
	{
		backendGroup.GET("/admin/list", handler.GetAdminListHandler) // 关联管理员接口
	}

	return r
}
