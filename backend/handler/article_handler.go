package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SearchArticle 查询官网文章列表
// 路由：GET /api/articles
func SearchArticle(c *gin.Context) {
	// 获取数据库实例
	db := c.MustGet("db").(*gorm.DB)
	var articles []model.Article

	// （可选）按分类筛选文章
	category := c.Query("category")
	query := db
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// 查询数据
	if err := query.Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"data":   articles,
		"module": "articles",
		"ok":     true,
	})
}

// DeleteArticle 删除文章（补充到 handler/article_handler.go）
func DeleteArticle(c *gin.Context) {
	id := c.Param("id")
	db := c.MustGet("db").(*gorm.DB)

	var article model.Article
	db.Where("id = ?", id).First(&article)

	if err := db.Where("id = ?", id).Delete(&model.Article{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	parsedID := uint(0)
	if article.ID > 0 {
		parsedID = article.ID
	}
	logAction(db, c, "delete_article", &parsedID, "删除文章: "+article.Title)

	c.JSON(http.StatusOK, gin.H{"msg": "删除成功"})
}

// ListArticles 文章列表（补充到 handler/article_handler.go）
func ListArticles(c *gin.Context) {
	category := c.Query("category")
	var articles []model.Article
	db := c.MustGet("db").(*gorm.DB)
	query := db
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if err := query.Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": articles})
}

// CreateArticle 新增官网文章
// 路由：POST /api/admin/articles
func CreateArticle(c *gin.Context) {
	// 绑定请求体参数
	var req struct {
		Category string `json:"category" binding:"required"` // 文章分类（必填）
		Title    string `json:"title" binding:"required"`    // 文章标题（必填）
		CoverUrl string `json:"cover_url"`                   // 封面图链接（可选）
		Content  string `json:"content" binding:"required"`  // 文章正文（必填）
		Author   string `json:"author" binding:"required"`   // 作者（必填）
		Status   int    `json:"status" binding:"oneof=0 1"`  // 状态：0=草稿，1=发布（可选，默认1）
		Sort     int    `json:"sort"`                        // 排序（可选，默认0）
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 补全默认值
	if req.Status == 0 {
		req.Status = 1 // 默认为发布状态
	}

	// 获取数据库实例
	db := c.MustGet("db").(*gorm.DB)
	// 构造文章对象
	article := model.Article{
		Category: req.Category,
		Title:    req.Title,
		CoverUrl: req.CoverUrl,
		Content:  req.Content,
		Author:   req.Author,
		Status:   req.Status,
		Sort:     req.Sort,
	}

	// 写入数据库
	if err := db.Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logAction(db, c, "create_article", &article.ID, "新增文章: "+article.Title)

	// 返回成功结果
	c.JSON(http.StatusOK, gin.H{"data": article, "ok": true})
}

// UpdateArticle 更新文章/资料
func UpdateArticle(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Title    string `json:"title"`
		CoverUrl string `json:"cover_url"`
		Content  string `json:"content"`
		Category string `json:"category"`
		Author   string `json:"author"`
		Status   int    `json:"status"`
		Sort     int    `json:"sort"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var article model.Article
	if err := db.Where("id = ?", id).First(&article).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}

	// 更新字段（非空才更新）
	if req.Title != "" {
		article.Title = req.Title
	}
	if req.CoverUrl != "" {
		article.CoverUrl = req.CoverUrl
	}
	if req.Content != "" {
		article.Content = req.Content
	}
	if req.Category != "" {
		article.Category = req.Category
	}
	if req.Author != "" {
		article.Author = req.Author
	}
	if req.Status != 0 {
		article.Status = req.Status
	}
	if req.Sort != 0 {
		article.Sort = req.Sort
	}

	if err := db.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	logAction(db, c, "update_article", &article.ID, "更新文章: "+article.Title)

	c.JSON(http.StatusOK, gin.H{"msg": "更新成功", "data": article})
}

// GetArticle 获取单篇文章/资料
func GetArticle(c *gin.Context) {
	id := c.Param("id")
	var article model.Article
	db := c.MustGet("db").(*gorm.DB)

	// 根据ID查询
	if err := db.Where("id = ?", id).First(&article).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": article})
}
