// handler/nav_handler.go
package handler

import (
    "Open-Source-Club-Nav/backend/model"
    "net/http"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
    "gorm.io/gorm"
)
// SearchNavItem 搜索导航站点
// @Summary 搜索导航站点
// @Description 根据标题或描述搜索导航站点
// @Tags 导航站
// @Accept json
// @Produce json
// @Param keyword query string true "搜索关键词"
// @Success 200 {array} NavItem "搜索结果列表"
// @Router /nav/search [get]
func SearchNavItem(c *gin.Context) {
	keyword := c.Query("keyword")
	var navItems []NavItem
	// 模糊查询标题/描述包含关键词的站点
	if err := db.Where("title LIKE ? OR content LIKE ?", "%"+keyword+"%", "%"+keyword+"%").Find(&navItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "搜索失败: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": navItems})
}
