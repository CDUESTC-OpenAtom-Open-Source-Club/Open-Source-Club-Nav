// handler/user_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"open-source-club-nav/backend/utils"

	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// RegisterHandler 用户注册接口（首字母大写，允许外部调用）
// @Summary 用户注册
// @Description 新用户注册，创建账号
// @Tags 用户
// @Accept json
// @Produce json
// @Param user body model.User true "注册信息"
// @Success 200 {string} string "注册成功"
// @Router /register [post]
func RegisterHandler(c *gin.Context) {
	// 1. 绑定请求参数
	var reqUser model.User
	if err := c.ShouldBindJSON(&reqUser); err != nil {
		utils.Logger.Warn("注册参数错误", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"msg": "参数错误: " + err.Error()})
		return
	}

	// 2. 获取DB连接
	db, ok := c.Get("db")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "数据库未初始化"})
		return
	}
	gormDB := db.(*gorm.DB)

	// 3. 密码加密
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(reqUser.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.Logger.Error("密码加密失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "注册失败"})
		return
	}
	reqUser.Password = string(hashedPwd)
	reqUser.Role = "user" // 默认普通用户

	// 4. 写入数据库
	if err := gormDB.Create(&reqUser).Error; err != nil {
		utils.Logger.Error("注册失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "注册失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"msg": "注册成功"})
}

// LoginHandler 用户登录接口
// @Summary 用户登录
// @Description 账号密码登录，获取Token
// @Tags 用户
// @Accept json
// @Produce json
// @Param user body model.User true "登录信息"
// @Success 200 {string} string "token"
// @Router /login [post]
func LoginHandler(c *gin.Context) {
	var reqUser model.User
	if err := c.ShouldBindJSON(&reqUser); err != nil {
		utils.Logger.Warn("登录参数错误", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"msg": "参数错误"})
		return
	}

	// 获取DB
	// 替换user_handler.go里的c.Get("db")代码（比如第80行）
	db, ok := c.Get("db")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "数据库未初始化"})
		return
	}
	gormDB := db.(*gorm.DB) // 后续用gormDB操作数据库
	var dbUser model.User
	if err := gormDB.Where("username = ?", reqUser.Username).First(&dbUser).Error; err != nil {
		utils.Logger.Warn("用户不存在", zap.String("username", reqUser.Username))
		c.JSON(http.StatusUnauthorized, gin.H{"msg": "账号或密码错误"})
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(dbUser.Password), []byte(reqUser.Password)); err != nil {
		utils.Logger.Warn("密码错误", zap.String("username", reqUser.Username))
		c.JSON(http.StatusUnauthorized, gin.H{"msg": "账号或密码错误"})
		return
	}

	// 生成Token
	token, err := utils.GenerateToken(dbUser.Username)
	if err != nil {
		utils.Logger.Error("Token生成失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "登录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GetAdminListHandler 获取管理员列表
// @Summary 获取管理员列表
// @Description 查看所有管理员账号
// @Tags 管理员
// @Produce json
// @Success 200 {array} model.User "管理员列表"
// @Router /backend/admin/list [get]
func GetAdminListHandler(c *gin.Context) {
	db, ok := c.Get("db")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "数据库未初始化"})
		return
	}
	gormDB := db.(*gorm.DB)
	var admins []model.User
	if err := gormDB.Where("role = ?", "admin").Find(&admins).Error; err != nil {
		utils.Logger.Error("查询管理员失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"msg": "查询失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": admins})
}
