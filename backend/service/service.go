package service

import (
	"context"
	"encoding/json"
	"open-source-club-nav/backend/model"
	"open-source-club-nav/backend/utils"
	"strings"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// UserService 处理用户相关业务逻辑
type UserService struct {
	db *gorm.DB
}

// NewUserService 初始化UserService
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// RegisterRequest 注册请求参数（和handler的DTO保持一致，也可以统一放到model/dto里）
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=8,max=256"`
}

// Register 执行注册业务逻辑
func (s *UserService) Register(req RegisterRequest) error {
	// 参数预处理
	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		return utils.ErrInvalidParam("用户名和密码不能为空")
	}
	if len(req.Username) > 64 {
		return utils.ErrInvalidParam("用户名长度不能超过64")
	}
	if len(req.Password) < 6 || len(req.Password) > 256 {
		return utils.ErrInvalidParam("密码长度需在6-256位之间")
	}

	// 密码加密
	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.Logger.Error("密码加密失败", zap.Error(err))
		return utils.ErrInternal("密码加密失败")
	}

	// 创建用户（固定Role为user，避免注入）
	newUser := model.User{
		Username:     req.Username,
		PasswordHash: hashed,
		Role:         "user", // 这里写死，防止前端注入role
	}
	if err := s.db.Create(&newUser).Error; err != nil {
		utils.Logger.Error("注册失败", zap.Error(err))
		return utils.ErrInternal("注册失败")
	}
	return nil
}

// LoginRequest 登录请求参数
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login 执行登录业务逻辑，返回Token
// Login 执行登录业务逻辑，返回安全Session（替换原Token）
func (s *UserService) Login(req LoginRequest) (string, error) {
	var dbUser model.User
	// 查询用户
	if err := s.db.Where("username = ?", req.Username).First(&dbUser).Error; err != nil {
		utils.Logger.Warn("用户不存在", zap.String("username", req.Username))
		return "", utils.ErrUnauthorized("账号或密码错误")
	}

	// 验证密码（原逻辑保留）
	ok, legacy := utils.VerifyPassword(req.Password, dbUser.PasswordHash)
	if !ok {
		utils.Logger.Warn("密码错误", zap.String("username", req.Username))
		return "", utils.ErrUnauthorized("账号或密码错误")
	}
	// 升级旧密码哈希（原逻辑保留）
	if legacy {
		if newHash, herr := utils.HashPassword(req.Password); herr == nil {
			s.db.Model(&model.User{}).Where("id = ?", dbUser.ID).Update("password_hash", newHash)
		}
	}

	// ========== 替换原Token生成逻辑 ==========
	// 1. 用crypto/rand生成安全Session
	session, err := utils.GenerateSession()
	if err != nil {
		utils.Logger.Error("Session生成失败", zap.Error(err))
		return "", utils.ErrInternal("登录失败")
	}

	// 2. 构造用户信息（只存必要字段）
	userInfo := map[string]interface{}{
		"id":   dbUser.ID,
		"role": dbUser.Role,
		"name": dbUser.Username,
	}
	userInfoBytes, _ := json.Marshal(userInfo)

	// 3. 区分普通用户/管理员Session，存入Redis（24小时过期）
	ctx := context.Background()
	sessionKeyPrefix := "user_session:" // 普通用户Session前缀
	if dbUser.Role == "super" || dbUser.Role == "editor" {
		sessionKeyPrefix = "admin_session:" // 管理员Session前缀
	}
	if err := utils.RedisClient.Set(
		ctx,
		sessionKeyPrefix+session,
		userInfoBytes,
		24*time.Hour, // Session有效期24小时
	).Err(); err != nil {
		utils.Logger.Error("Session存储失败", zap.Error(err))
		return "", utils.ErrInternal("登录失败")
	}
	// ========== 替换结束 ==========

	return session, nil
}

// GetAdminList 获取管理员列表
func (s *UserService) GetAdminList() ([]model.User, error) {
	var admins []model.User
	if err := s.db.Where("role IN ?", []string{"super", "editor"}).Find(&admins).Error; err != nil {
		utils.Logger.Error("查询管理员失败", zap.Error(err))
		return nil, utils.ErrInternal("查询失败")
	}
	return admins, nil
}
