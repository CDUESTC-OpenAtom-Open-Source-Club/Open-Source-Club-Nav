// handler/resource_matrix_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// navItemToResourceMatrix 将 NavItem 转换为 ResourceMatrix 格式
// 用于 legacy /api/resources 接口兼容
func navItemToResourceMatrix(item model.NavItem) model.ResourceMatrix {
	// 将 sub_type 映射为 category
	category := item.SubType
	if category == "" {
		category = item.Category
	}

	// 根据 sub_type 或 icon 生成标签
	tag := item.Icon
	if tag == "" {
		switch category {
		case "think_tank":
			tag = "Learning"
		case "campus":
			tag = "Campus"
		case "tools":
			tag = "Dev"
		}
	}

	return model.ResourceMatrix{
		Model: gorm.Model{
			ID: item.ID,
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		},
		Category: category,
		Name:     item.Title,
		Url:      item.LinkUrl,
		Desc:     item.Description,
		Tag:      tag,
	}
}

// SearchResourceMatrix 查询资源矩阵列表
// 路由：GET /api/resources?module=resource_matrix
// 数据来源：nav_items 表中 content_type='resource_matrix' 的记录
func SearchResourceMatrix(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// 从 nav_items 表读取资源矩阵数据，避免 resource_matrix 表显示第三套数据
	var navItems []model.NavItem
	query := db.Model(&model.NavItem{}).Where("content_type = ?", "resource_matrix")

	// 可选：按 keyword 模糊搜索
	keyword := c.Query("keyword")
	if keyword != "" {
		likeKeyword := "%" + keyword + "%"
		query = query.Where("title LIKE ? OR description LIKE ? OR sub_type LIKE ?", likeKeyword, likeKeyword, likeKeyword)
	}

	// 按 sort 排序
	if err := query.Order("sort ASC, id ASC").Find(&navItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 转换为 legacy ResourceMatrix 格式
	resources := make([]model.ResourceMatrix, 0, len(navItems))
	for _, item := range navItems {
		resources = append(resources, navItemToResourceMatrix(item))
	}

	// 返回对齐上级格式
	c.JSON(http.StatusOK, gin.H{
		"data":   resources,
		"module": "resource_matrix",
		"ok":     true,
	})
}

// DeleteResourceMatrix 删除资源矩阵
func DeleteResourceMatrix(c *gin.Context) {
	// 1. 获取数据库实例
	db := c.MustGet("db").(*gorm.DB)
	// 2. 获取要删除的资源ID
	id := c.Param("id")

	// 3. 执行删除
	var resource model.ResourceMatrix
	if err := db.Delete(&resource, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除资源失败"})
		return
	}

	parsedID, _ := strconv.ParseUint(id, 10, 32)
	uid := uint(parsedID)
	logAction(db, c, "delete_resource", &uid, "删除资源 ID: "+id)

	// 4. 返回成功
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// CreateResourceMatrix 新增资源矩阵
// 路由：POST /api/admin/resources
func CreateResourceMatrix(c *gin.Context) {
	var req struct {
		Category string `json:"category" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Url      string `json:"url" binding:"required"`
		Desc     string `json:"desc"`
		Tag      string `json:"tag"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	resource := model.ResourceMatrix{
		Category: req.Category,
		Name:     req.Name,
		Url:      req.Url,
		Desc:     req.Desc,
		Tag:      req.Tag,
	}
	if err := db.Create(&resource).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logAction(db, c, "create_resource", &resource.ID, "新增资源: "+resource.Name)

	c.JSON(http.StatusOK, gin.H{"data": resource, "ok": true})
}

// UpdateResourceMatrix 编辑资源矩阵
// 路由：PUT /api/admin/resources/:id
func UpdateResourceMatrix(c *gin.Context) {
	// 1. 获取资源ID
	id := c.Param("id")

	// 2. 绑定请求体
	var req struct {
		Category string `json:"category"`
		Name     string `json:"name"`
		Url      string `json:"url"`
		Desc     string `json:"desc"`
		Tag      string `json:"tag"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. 更新表数据
	db := c.MustGet("db").(*gorm.DB)
	var resource model.ResourceMatrix
	if err := db.First(&resource, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "资源不存在"})
		return
	}
	// 只更新传了值的字段
	if req.Category != "" {
		resource.Category = req.Category
	}
	if req.Name != "" {
		resource.Name = req.Name
	}
	if req.Url != "" {
		resource.Url = req.Url
	}
	resource.Desc = req.Desc
	resource.Tag = req.Tag

	if err := db.Save(&resource).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logAction(db, c, "update_resource", &resource.ID, "更新资源: "+resource.Name)

	c.JSON(http.StatusOK, gin.H{"data": resource, "ok": true})
}
