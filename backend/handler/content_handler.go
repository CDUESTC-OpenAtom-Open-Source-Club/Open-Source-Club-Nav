package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// GetContentByType 获取内容列表
// @Summary 获取内容列表
// @Description 获取所有内容列表
// @Tags 内容管理
// @Accept json
// @Produce json
// @Success 200 {array} model.NavItem "内容列表"
// @Router /api/content [get]
func GetContentByType(c *gin.Context) {
	db, _ := c.Get("db")
	gormDB := db.(*gorm.DB)

	var items []model.NavItem
	if err := gormDB.Find(&items).Error; err != nil {
		zap.L().Error("获取内容失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取内容失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// CreateContent 创建新内容
// @Summary 创建内容
// @Description 创建新内容
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
