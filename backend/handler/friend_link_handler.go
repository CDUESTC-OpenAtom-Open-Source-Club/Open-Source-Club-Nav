// handler/friend_link_handler.go
package handler

import (
	"fmt"
	"net/http"
	"open-source-club-nav/backend/model" // 替换为你项目的model包路径
	"strings"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

type linkInput struct {
	Title             string `json:"title"`
	Url               string `json:"url"`
	Description       string `json:"description"`
	Sort              *int   `json:"sort"`
	Active            *int   `json:"active"`
	Module            string `json:"module"`
	ResourceSubModule string `json:"resource_sub_module"`
	GameType          string `json:"game_type"`
}

func normalizeResourceSubModule(subModule string) string {
	switch strings.TrimSpace(subModule) {
	case "think_tank", "campus", "tools":
		return strings.TrimSpace(subModule)
	default:
		return "think_tank"
	}
}

func applyLinkInputToNavItem(item *model.NavItem, input linkInput, partial bool) {
	module := normalizeNavModule(input.Module)
	if !partial || input.Module != "" {
		item.ContentType = module
		item.Category = module
	}

	if !partial || input.Title != "" {
		item.Title = strings.TrimSpace(input.Title)
	}
	if !partial || input.Url != "" {
		item.LinkUrl = strings.TrimSpace(input.Url)
	}
	if !partial || input.Description != "" {
		item.Description = strings.TrimSpace(input.Description)
		item.Content = strings.TrimSpace(input.Description)
	}
	if input.Sort != nil {
		item.Sort = *input.Sort
	}
	if input.Active != nil {
		item.Active = *input.Active
	} else if !partial {
		item.Active = 1
	}

	if item.ContentType == "resource_matrix" {
		item.SubType = normalizeResourceSubModule(input.ResourceSubModule)
	} else if !partial || input.Module != "" {
		item.SubType = ""
	}

	if item.ContentType == "mini_games" {
		item.GameType = strings.TrimSpace(input.GameType)
	} else if !partial || input.Module != "" {
		item.GameType = ""
	}
}

// CreateFriendLink 新增友情链接（对齐上级/api/admin/links）
// @Summary 新增友情链接
// @Tags friend-link
// @Accept json
// @Produce json
// @Param data body struct{Title string `json:"title" binding:"required"`;Url string `json:"url" binding:"required"`;Sort int `json:"sort"`} true "友情链接信息"
// @Success 200 {object} map[string]interface{} "新增结果"
// @Router /api/admin/links [post]
func CreateFriendLink(c *gin.Context) {
	// 1. 绑定请求参数（对齐上级要求的title/url/sort）
	var req linkInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Url) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "标题和 URL 不能为空"})
		return
	}

	// 2. 获取DB连接
	db, ok := c.Get("db")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接未初始化"})
		return
	}
	// 修正拼写：gomDB → gormDB
	gormDB, ok := db.(*gorm.DB)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接类型错误"})
		return
	}

	// 3. 写入统一导航内容表。后台内容管理、首页资源矩阵和健康检测都从 nav_items 读取。
	link := model.NavItem{}
	applyLinkInputToNavItem(&link, req, false)
	if err := gormDB.Omit("BusinessTable", "BusinessTableId").Create(&link).Error; err != nil {
		zap.L().Error("新增导航链接失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "新增失败：" + err.Error()})
		return
	}

	logAction(gormDB, c, "create_link", &link.ID, fmt.Sprintf("新增%s: %s", normalizeNavModule(link.ContentType), link.Title))

	// 4. 返回结果（对齐上级格式）
	c.JSON(http.StatusOK, gin.H{
		"data":   navItemToLinkDTO(link),
		"module": link.ContentType,
		"ok":     true,
	})
}

// UpdateFriendLink 编辑友情链接（对齐上级/api/admin/links/:id）
// @Summary 编辑友情链接
// @Tags friend-link
// @Accept json
// @Produce json
// @Param id path int true "友情链接ID"
// @Param data body struct{Title string `json:"title"`;Url string `json:"url"`;Sort int `json:"sort"`} true "更新信息"
// @Success 200 {object} map[string]interface{} "编辑结果"
// @Router /api/admin/links/{id} [put]
func UpdateFriendLink(c *gin.Context) {
	// 1. 获取路径参数（ID）和请求体
	id := c.Param("id")
	var req linkInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2. 获取DB连接
	db, ok := c.Get("db")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接未初始化"})
		return
	}
	gormDB, ok := db.(*gorm.DB)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接类型错误"})
		return
	}

	// 3. 查询要更新的导航链接
	var link model.NavItem
	if err := gormDB.First(&link, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "链接不存在"})
		return
	}

	// 4. 更新字段（只更新传入的非空内容；active 可显式置 0）
	applyLinkInputToNavItem(&link, req, true)

	// 5. 保存更新
	if err := gormDB.Omit("BusinessTable", "BusinessTableId").Save(&link).Error; err != nil {
		zap.L().Error("更新导航链接失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败：" + err.Error()})
		return
	}

	logAction(gormDB, c, "update_link", &link.ID, "更新导航链接: "+link.Title)

	// 6. 返回结果（对齐上级格式）
	c.JSON(http.StatusOK, gin.H{
		"data":   navItemToLinkDTO(link),
		"module": link.ContentType,
		"ok":     true,
	})
}

// DeleteFriendLink 删除友情链接（DELETE /api/admin/links/:id 或 ?id=X）
func DeleteFriendLink(c *gin.Context) {
	db, ok := c.Get("db")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接未初始化"})
		return
	}
	gormDB, ok := db.(*gorm.DB)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接类型错误"})
		return
	}

	id := c.Param("id")
	if id == "" {
		id = c.Query("id")
	}
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少链接 ID"})
		return
	}

	var link model.NavItem
	if err := gormDB.First(&link, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "链接不存在"})
		return
	}

	if err := gormDB.Delete(&link).Error; err != nil {
		zap.L().Error("删除导航链接失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败：" + err.Error()})
		return
	}

	logAction(gormDB, c, "delete_link", &link.ID, "删除导航链接: "+link.Title)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
