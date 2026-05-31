// handler/nav_handler.go
package handler

import (
	"net/http"
	"open-source-club-nav/backend/model" // 替换为你的项目实际包名

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetNavWithBusiness 获取导航项+关联的业务数据
// @Summary 获取导航项及关联的业务数据
// @Description 根据导航项ID，查询导航项信息及关联的业务表数据
// @Accept json
// @Produce json
// @Param id path int true "导航项ID"
// @Success 200 {object} map[string]interface{} "导航项信息+关联业务数据"
// @Failure 404 {object} map[string]string "导航项不存在"
// @Router /api/nav/{id} [get]
// @Security ApiKeyAuth  // 这一行是Swagger的授权配置，和原有接口保持一致
func GetNavWithBusiness(c *gin.Context) {
	// 从Gin上下文获取数据库实例
	db := c.MustGet("db").(*gorm.DB)
	var nav model.NavItem

	// 根据URL中的id查询导航项
	if err := db.First(&nav, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "导航项不存在"})
		return
	}

	// 根据关联表查询业务数据
	var businessData interface{}
	switch nav.BusinessTable {
	case "friend_links":
		var links []model.FriendLink
		db.Order("sort ASC").Find(&links)
		businessData = links
	case "resource_matrix":
		var resources []model.ResourceMatrix
		db.Find(&resources)
		businessData = resources
	case "mini_games":
		var games []model.MiniGame
		db.Find(&games)
		businessData = games
	case "articles":
		var articles []model.Article
		db.Find(&articles)
		businessData = articles
	default:
		businessData = nil
	}

	// 返回结果
	c.JSON(http.StatusOK, gin.H{
		"nav":           nav,
		"business_data": businessData,
		"ok":            true,
	})
}

// 恢复旧的SearchNavItem函数（保留友情链接查询功能）
// @Summary 搜索导航站点
// @Description 搜索导航标题或描述含关键词的站点
// @Accept json
// @Produce json
// @Param keyword query string true "搜索关键词"
// @Success 200 {array} model.FriendLink "搜索结果列表"
// @Router /api/links [get]
func SearchNavItem(c *gin.Context) {
	// 1. 获取请求参数
	keyword := c.Query("keyword")
	var links []model.FriendLink

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

	// 3. 执行查询（这里是示例，根据实际业务调整）
	if keyword != "" {
		gormDB.Where("title LIKE ?", "%"+keyword+"%").Find(&links)
	} else {
		gormDB.Find(&links)
	}

	// 4. 返回结果
	c.JSON(http.StatusOK, links)
}
