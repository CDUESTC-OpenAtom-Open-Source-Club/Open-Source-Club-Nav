// handler/nav_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// SearchNavItem 搜索导航站点（首字母大写，允许外部包调用）
// @Summary 搜索导航站点
// @Description 搜索导航标题或描述含关键词的站点
// @Tags 导航站
// @Accept json
// @Produce json
// @Param keyword query string true "搜索关键词"
// @Success 200 {array} model.NavItem "搜索结果列表"
// @Router /nav/search [get]
func SearchNavItem(c *gin.Context) {
	// 1. 获取请求参数
	keyword := c.Query("keyword")
	var navItems []model.NavItem

	// 2. 从Context中获取DB连接
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

	// 3. 模糊查询（标题或内容包含关键词）
	likeKeyword := "%" + strings.TrimSpace(keyword) + "%"
	if err := gormDB.Where("title LIKE ? OR content LIKE ?", likeKeyword, likeKeyword).Find(&navItems).Error; err != nil {
		zap.L().Error("搜索失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "搜索失败: " + err.Error()})
		return
	}

	// 4. 返回结果
	c.JSON(http.StatusOK, gin.H{"data": navItems})
}
