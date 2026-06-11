// handler/resource_matrix_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SearchResourceMatrix 查询资源矩阵列表
// 路由：GET /api/resources?module=resource_matrix
// SearchResourceMatrix 查询资源矩阵列表
// 路由：GET /api/resources?module=resource_matrix
func SearchResourceMatrix(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var resources []model.ResourceMatrix

	// （可选）加模糊查询：按name/category搜索
	keyword := c.Query("keyword")
	query := db
	if keyword != "" {
		// 把sort换成id排序
		query = query.Where("name LIKE ? OR category LIKE ?", "%"+keyword+"%", "%"+keyword+"%").Order("id ASC")
	} else {
		// 把sort换成id排序
		query = query.Order("id ASC")
	}

	// 查询表数据
	if err := query.Find(&resources).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
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
