package router

import (
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/middleware"
	"open-source-club-nav/backend/utils"
	"strings"

	"github.com/gin-contrib/cors"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// 初始化路由（传入数据库连接，后续注入到Context）
func InitRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()
	// 1. 初始化Logger（添加这2行）
	logger := utils.InitLogger()
	defer utils.SyncLogger(logger) // 程序退出时同步日志

	// 2. 示例：给中间件/handler注入Logger（比如给InjectDB中间件传Logger）
	// （如果你的中间件需要日志，就把logger传进去，这里是示例）
	r.Use(middleware.InjectDB(db, logger))

	// ========== 在这里添加CORS中间件 ==========
	corsOrigins := strings.Split(cfg.CORS.AllowedOrigins, ",")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Cookie", "X-CSRF-Token"}, // 加X-CSRF-Token
		AllowCredentials: true,
	}))

	r.Use(middleware.InjectDB(db, logger))

	// 2. Swagger路由（原有代码）
	if gin.Mode() != gin.ReleaseMode {
		r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// 公共接口：挂载到/api/v1下
	v1Group := r.Group("/api/v1")
	registerPublicRoutes(v1Group, logger) // 调用拆分后的公共路由函数

	// 后台接口（调用拆分函数，路径前缀：/api/admin）
	registerPrivateRoutes(r.Group("/api/admin"))

	// 私有子接口（调用拆分函数）
	registerPrivateSubRoutes(r.Group(""))

	return r

}
