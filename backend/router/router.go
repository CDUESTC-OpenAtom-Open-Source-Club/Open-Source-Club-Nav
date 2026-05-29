// router/router.go
package router

import (
	"time"

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
	// 注意：不再把 net/http DefaultServeMux 暴露在 /debug/pprof，
	// 避免一旦引入 net/http/pprof 即出现无鉴权的公开性能剖析端点。
	// 生产环境（GIN_MODE=release）不暴露 swagger，避免泄露完整 API 清单。
	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// 3. 原main.go里的“公开接口”
	// 注册/登录各自独立的 IP 限流桶，缓解暴力尝试与批量注册（互不影响）。
	r.POST("/register", handler.RateLimit(10, time.Minute), handler.RegisterHandler) // 关联handler里的注册接口
	r.POST("/login", handler.RateLimit(20, time.Minute), handler.LoginHandler)       // 关联handler里的登录接口
	r.GET("/nav/search", handler.SearchNavItem)                                      // 关联handler里的导航搜索接口

	// 4. 原main.go里的“管理员接口（带权限）”
	// 角色口径与 Next BFF 统一为 super/editor/user；管理员清单仅 super 可见。
	backendGroup := r.Group("/backend")
	backendGroup.Use(handler.AuthMiddleware())     // 登录校验
	backendGroup.Use(handler.RequireRole("super")) // 管理员角色校验（RBAC）
	{
		backendGroup.GET("/admin/list", handler.GetAdminListHandler) // 关联管理员接口
	}

	return r
}
