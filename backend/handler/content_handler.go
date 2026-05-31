// handler/content_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// GetContentByType 根据内容类型获取内容列表
// @Summary 获取内容列表
// @Description 根据 content_type 和 sub_type 获取内容列表
// @Tags 内容管理
// @Accept json
// @Produce json
// @Param content_type query string true "内容类型 (resource/official_news)"
// @Param sub_type query string false "子类型 (learning_material/open_source/tech_articles/activity_review/tools)"
// @Success 200 {array} model.NavItem "内容列表"
// @Router /api/content [get]
func GetContentByType(c *gin.Context) {
	db, _ := c.Get("db")
	gormDB := db.(*gorm.DB)

	contentType := c.Query("content_type")
	subType := c.Query("sub_type")

	var items []model.NavItem
	query := gormDB.Where("active = ?", 1)

	// 支持获取资料分类、官网文章和小游戏
	if contentType != "" {
		if contentType != "resource" && contentType != "official_news" && contentType != "mini_games" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的内容类型"})
			return
		}
		if contentType == "mini_games" {
			// 小游戏通过 category 字段筛选
			query = query.Where("category = ?", "mini_games")
		} else {
			query = query.Where("content_type = ?", contentType)
		}
	}

	// 验证子类型
	if subType != "" {
		validSubTypes := map[string]bool{
			"learning_material": true,
			"open_source":       true,
			"tech_articles":     true,
			"activity_review":   true,
			"tools":             true,
		}
		if !validSubTypes[subType] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的子类型"})
			return
		}
		query = query.Where("sub_type = ?", subType)
	}

	// 支持按 game_type 筛选小游戏
	gameType := c.Query("game_type")
	if gameType != "" {
		validGameTypes := map[string]bool{
			"internal": true,
			"external": true,
		}
		if !validGameTypes[gameType] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的游戏类型，可选: internal, external"})
			return
		}
		query = query.Where("game_type = ?", gameType)
	}

	query = query.Order("sort ASC, id ASC")

	if err := query.Find(&items).Error; err != nil {
		zap.L().Error("获取内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取内容失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// CreateContent 创建新内容
// @Summary 创建内容
// @Description 创建新内容（资料分类或官网文章）
// @Tags 内容管理
// @Accept json
// @Produce json
// @Param item body model.NavItem true "内容信息"
// @Success 201 {object} model.NavItem "创建成功"
// @Router /api/content [post]
func CreateContent(c *gin.Context) {
	db, _ := c.Get("db")
	gormDB := db.(*gorm.DB)

	var item model.NavItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 验证内容类型（支持 mini_games 模块）
	isMiniGame := item.Category != nil && *item.Category == "mini_games"
	if item.ContentType != "resource" && item.ContentType != "official_news" {
		if !isMiniGame {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的内容类型"})
			return
		}
		item.ContentType = "resource"
	}

	// 验证子类型
	if item.ContentType == "resource" && item.SubType != nil {
		validSubTypes := map[string]bool{
			"learning_material": true,
			"open_source":       true,
			"tech_articles":     true,
			"activity_review":   true,
			"tools":             true,
		}
		if !validSubTypes[*item.SubType] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的子类型"})
			return
		}
	}

	// 验证游戏类型（仅 mini_games 模块）
	if isMiniGame {
		if item.GameType == nil || (*item.GameType != "internal" && *item.GameType != "external") {
			defaultInternal := "internal"
			item.GameType = &defaultInternal
		}
	}

	// 设置默认值
	if item.Active == 0 {
		item.Active = 1
	}

	if err := gormDB.Create(&item).Error; err != nil {
		zap.L().Error("创建内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建内容失败"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

// UpdateContent 更新内容
// @Summary 更新内容
// @Description 更新指定 ID 的内容
// @Tags 内容管理
// @Accept json
// @Produce json
// @Param id path int true "内容 ID"
// @Param item body model.NavItem true "内容信息"
// @Success 200 {object} model.NavItem "更新成功"
// @Router /api/content/{id} [put]
func UpdateContent(c *gin.Context) {
	db, _ := c.Get("db")
	gormDB := db.(*gorm.DB)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ID"})
		return
	}

	var item model.NavItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 验证内容类型（支持 mini_games 模块）
	isMiniGame := item.Category != nil && *item.Category == "mini_games"
	if item.ContentType != "resource" && item.ContentType != "official_news" {
		if !isMiniGame {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的内容类型"})
			return
		}
		item.ContentType = "resource"
	}

	// 验证子类型
	if item.ContentType == "resource" && item.SubType != nil {
		validSubTypes := map[string]bool{
			"learning_material": true,
			"open_source":       true,
			"tech_articles":     true,
			"activity_review":   true,
			"tools":             true,
		}
		if !validSubTypes[*item.SubType] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "无效的子类型"})
			return
		}
	}

	// 验证游戏类型（仅 mini_games 模块）
	if isMiniGame {
		if item.GameType == nil || (*item.GameType != "internal" && *item.GameType != "external") {
			defaultInternal := "internal"
			item.GameType = &defaultInternal
		}
	}

	item.ID = uint(id)

	if err := gormDB.Save(&item).Error; err != nil {
		zap.L().Error("更新内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新内容失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// DeleteContent 删除内容
// @Summary 删除内容
// @Description 删除指定 ID 的内容
// @Tags 内容管理
// @Accept json
// @Produce json
// @Param id path int true "内容 ID"
// @Success 200 {string} string "删除成功"
// @Router /api/content/{id} [delete]
func DeleteContent(c *gin.Context) {
	db, _ := c.Get("db")
	gormDB := db.(*gorm.DB)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ID"})
		return
	}

	if err := gormDB.Delete(&model.NavItem{}, id).Error; err != nil {
		zap.L().Error("删除内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除内容失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// ToggleContentActive 切换内容启用状态
// @Summary 切换内容状态
// @Description 切换内容的启用/禁用状态
// @Tags 内容管理
// @Accept json
// @Produce json
// @Param id path int true "内容 ID"
// @Success 200 {object} model.NavItem "切换成功"
// @Router /api/content/{id}/toggle [put]
func ToggleContentActive(c *gin.Context) {
	db, _ := c.Get("db")
	gormDB := db.(*gorm.DB)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ID"})
		return
	}

	var item model.NavItem
	if err := gormDB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "内容不存在"})
		return
	}

	if item.Active == 1 {
		item.Active = 0
	} else {
		item.Active = 1
	}

	if err := gormDB.Save(&item).Error; err != nil {
		zap.L().Error("切换状态失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "切换状态失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}