// handler/user_handler.go
package handler

import (
	"Open-Source-Club-Nav/backend/model" 
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)
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
