// handler/user_handler.go
package handler

import (
	"Open-Source-Club-Nav/backend/model" 
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)
// @Summary 用户注册
// @Description 新用户注册，创建账号
// @Tags 用户  // 新增：分组到“用户”
// @Accept json
// @Produce json
// @Param user body User true "注册信息"
// @Success 200 {string} string "注册成功"
// @Failure 400 {string} string "参数错误"
// @Failure 500 {string} string "注册失败"
// @Router /register [post]  // 新增：指定路由和请求方式
func registerHandler(c *gin.Context) {
	// 1. 接收注册参数（省略已有逻辑）
	var user User
	c.ShouldBindJSON(&user)
	// 2. 设置默认角色为user
	user.Role = "user"
	// 3. 保存到数据库（省略已有逻辑）
	db.Create(&user)

	// 4. 生成Token（和loginHandler里的逻辑一致）
	expireTime := time.Now().Add(time.Hour * 24)
	claims := Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireTime),
			Issuer:    "backend",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(viper.GetString("jwt.secret")))

	// 5. 返回Token
	c.JSON(200, gin.H{
		"code":  200,
		"msg":   "注册成功",
		"token": tokenStr, // 新增这行
		"role":  user.Role,
	})
}
// @Summary 用户登录
// @Description 账号登录，获取身份令牌
// @Tags 用户  // 新增：指定分组为“用户”
// @Accept json
// @Produce json
// @Param user body User true "登录信息"
// @Success 200 {string} string "登录成功"
// @Failure 400 {string} string "参数错误"
// @Failure 401 {string} string "账号或密码错误"
// @Router /login [post]  // 新增：指定路由和请求方式
func loginHandler(c *gin.Context) {
	var reqUser User
	if err := c.ShouldBindJSON(&reqUser); err != nil {
		logger.Error("登录参数错误", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	logger.Info("后端实际收到的密码", zap.String("pwd", reqUser.Password))
	logger.Info("准备查询的邮箱", zap.String("query_email", reqUser.Username))

	// 查询用户
	// 原来的查询：可能没包含role
	// if err := db.Where("email = ?", reqUser.Username).First(&dbUser).Error; err != nil {
	var dbUser User
	// 修改后：显式查询role字段
	if err := db.Select("id", "username", "password", "role").Where("Username = ?", reqUser.Username).First(&dbUser).Error; err != nil {
		logger.Warn("用户不存在", zap.String("username", reqUser.Username))
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "账号或密码错误"})
		return
	}
	// 新增：对比密码（现在是明文，后续要加密）
	if dbUser.Password != reqUser.Password {
		logger.Warn("密码错误", zap.String("username", reqUser.Username))
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "账号或密码错误"})
		return
	}
	// 生成JWT Token
	expireTime := time.Now().Add(time.Duration(viper.GetInt("jwt.expire")) * time.Second)
	claims := Claims{
		Username: dbUser.Username,
		Role:     dbUser.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "backend",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(viper.GetString("jwt.secret")))
	if err != nil {
		logger.Error("生成Token失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "msg": "登录失败"})
		return
	}

	logger.Info("用户登录成功", zap.String("username", dbUser.Username))
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "登录成功", "token": tokenStr})
}

// 权限中间件（验证JWT & 检查Role）
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.GetHeader("Authorization")
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "请登录"})
			c.Abort()
			return
		}

		// 解析Token
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(viper.GetString("jwt.secret")), nil
		})
		if err != nil || !token.Valid {
			logger.Warn("Token无效", zap.Error(err))
			c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "Token无效"})
			c.Abort()
			return
		}

		// 把用户信息存入上下文
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}
// @Summary 管理员接口
// @Description 需要admin权限的接口
// @Tags 管理员  // 新增：分组到“管理员”
// @Accept json
// @Produce json
// @Header 200 {string} Authorization "身份令牌格式: Bearer 令牌字符串"
// @Param Authorization header string true "身份令牌（格式: Bearer 令牌字符串）"
// @Success 200 {string} string "admin接口访问成功"
// @Failure 401 {string} string "未登录或权限不足"
// @Router /backend/test [get]  // 新增：指定路由和请求方式
func backendHandler(c *gin.Context) {
	// 1. 从Header获取Token（格式是"Bearer xxxxx"）
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "未携带Token"})
		return
	}
	// 分割"Bearer "和Token字符串
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	// 2. 解析Token
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		// 用配置里的jwt.secret解密
		return []byte(viper.GetString("jwt.secret")), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "msg": "Token无效"})
		return
	}

	// 3. 校验角色是否是admin
	logger.Info("Token中的角色", zap.String("role", claims.Role))
	if claims.Role != "admin" {
		logger.Warn("权限不足", zap.String("role", claims.Role))
		c.JSON(http.StatusForbidden, gin.H{"code": 403, "msg": "权限不足"})
		return
	}

	// 4. 接口逻辑
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "admin接口访问成功"})
}

// 初始化配置
func initConfig() {
	viper.SetConfigFile("config.yaml")
	if err := viper.ReadInConfig(); err != nil {
		panic("读取配置失败: " + err.Error())
	}
}

// 初始化日志
func initLogger() {
	var err error
	logger, err = zap.NewProduction()
	if err != nil {
		panic("初始化日志失败: " + err.Error())
	}
}

// 初始化数据库
func initDB() {
	var err error
	db, err = gorm.Open(mysql.Open(viper.GetString("mysql.dsn")), &gorm.Config{})
	if err != nil {
		panic("连接数据库失败: " + err.Error())
	}

	// 自动迁移表
	if err := db.AutoMigrate(&User{}); err != nil {
		panic("创建表失败: " + err.Error())
	}
}

// RequireRole 生成带角色校验的中间件（比如RequireRole("admin")）
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 从请求头获取Token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "请先登录"})
			c.Abort()
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		// 2. 解析Token（替换成你自己的JWT密钥）
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte("你的JWT密钥"), nil // 改成你实际用的密钥
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "登录已过期"})
			c.Abort()
			return
		}

		// 3. 校验角色是否匹配
		if claims.Role != requiredRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "无权限访问"})
			c.Abort()
			return
		}

		// 角色通过，继续执行接口
		c.Next()
	}
}
