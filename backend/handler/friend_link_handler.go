// handler/friend_link_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model" // 替换为你项目的model包路径

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

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
	var req struct {
		Title string `json:"title" binding:"required"` // 上级要求的title
		Url   string `json:"url" binding:"required"`   // 上级要求的url（对应LinkUrl）
		Sort  int    `json:"sort"`                     // 上级要求的sort
	}
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
	// 修正拼写：gomDB → gormDB
	gormDB, ok := db.(*gorm.DB)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "数据库连接类型错误"})
		return
	}

	// 3. 写入friend_links表
	link := model.FriendLink{
		Title:   req.Title,
		LinkUrl: req.Url, // 对应表的LinkUrl字段
		Sort:    req.Sort,
	}
	if err := gormDB.Create(&link).Error; err != nil {
		zap.L().Error("新增友情链接失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "新增失败：" + err.Error()})
		return
	}

	// 4. 返回结果（对齐上级格式）
	c.JSON(http.StatusOK, gin.H{
		"data":   link,
		"module": "friend_links",
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
	var req struct {
		Title string `json:"title"` // 可选更新的title
		Url   string `json:"url"`   // 可选更新的url
		Sort  int    `json:"sort"`  // 可选更新的sort
	}
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

	// 3. 查询要更新的友情链接
	var link model.FriendLink
	if err := gormDB.First(&link, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "友情链接不存在"})
		return
	}

	// 4. 更新字段（只更新非空/有变化的内容）
	if req.Title != "" {
		link.Title = req.Title
	}
	if req.Url != "" {
		link.LinkUrl = req.Url
	}
	link.Sort = req.Sort // 即使Sort为空，也用请求的值覆盖

	// 5. 保存更新
	if err := gormDB.Save(&link).Error; err != nil {
		zap.L().Error("更新友情链接失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败：" + err.Error()})
		return
	}

	// 6. 返回结果（对齐上级格式）
	c.JSON(http.StatusOK, gin.H{
		"data":   link,
		"module": "friend_links",
		"ok":     true,
	})
}
