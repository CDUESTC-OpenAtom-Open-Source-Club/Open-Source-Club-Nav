// handler/nav_handler.go
package handler

// 测试部署不要管这行注释后续可删掉
import (
	"net/http"
	"open-source-club-nav/backend/model" // 替换为你的项目实际包名
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func normalizeNavModule(module string) string {
	switch strings.TrimSpace(module) {
	case "resource_matrix", "friend_links", "mini_games":
		return strings.TrimSpace(module)
	default:
		return "friend_links"
	}
}

func navItemToLinkDTO(item model.NavItem) gin.H {
	module := item.ContentType
	if module == "" {
		module = item.Category
	}
	module = normalizeNavModule(module)

	dto := gin.H{
		"id":           item.ID,
		"title":        item.Title,
		"url":          item.LinkUrl,
		"link_url":     item.LinkUrl,
		"description":  item.Description,
		"sort":         item.Sort,
		"active":       item.Active,
		"module":       module,
		"content_type": item.ContentType,
		"category":     item.Category,
		"icon":         item.Icon,
		"icon_url":     item.IconUrl,
		"cover_url":    item.CoverUrl,
		"game_type":    item.GameType,
		"click_count":  0,
		"created_at":   item.CreatedAt,
		"updated_at":   item.UpdatedAt,
	}

	if item.SubType != "" {
		dto["resource_sub_module"] = item.SubType
		dto["sub_type"] = item.SubType
	}

	return dto
}

func navItemsToLinkDTOs(items []model.NavItem) []gin.H {
	links := make([]gin.H, 0, len(items))
	for _, item := range items {
		links = append(links, navItemToLinkDTO(item))
	}
	return links
}

func setNoStoreCacheHeaders(c *gin.Context) {
	c.Header("Cache-Control", "no-store, no-cache, must-revalidate")
	c.Header("CDN-Cache-Control", "no-store")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")
}

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
	setNoStoreCacheHeaders(c)

	// 1. 获取请求参数
	keyword := strings.TrimSpace(c.Query("keyword"))
	module := strings.TrimSpace(c.Query("module"))
	resourceSubModule := strings.TrimSpace(c.Query("resource_sub_module"))
	id := strings.TrimSpace(c.Query("id"))

	limit := 20
	if rawLimit := strings.TrimSpace(c.DefaultQuery("limit", "")); rawLimit != "" {
		if parsed, err := strconv.Atoi(rawLimit); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		limit = 100
	}

	offset := 0
	if rawOffset := strings.TrimSpace(c.DefaultQuery("offset", "")); rawOffset != "" {
		if parsed, err := strconv.Atoi(rawOffset); err == nil && parsed > 0 {
			offset = parsed
		}
	}

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

	query := gormDB.Model(&model.NavItem{})

	hasFilter := false
	if id != "" {
		query = query.Where("id = ?", id)
		hasFilter = true
	}

	// 支持 module 筛选。nav_items 的真实模块字段是 content_type，category 作为兼容字段保留。
	if module != "" {
		query = query.Where("(content_type = ? OR category = ?)", module, module)
		hasFilter = true
		if module == "resource_matrix" && resourceSubModule != "" {
			query = query.Where("sub_type = ?", resourceSubModule)
		}
	}

	if keyword != "" {
		likeKeyword := "%" + keyword + "%"
		query = query.Where("(title LIKE ? OR description LIKE ? OR content LIKE ? OR link_url LIKE ?)", likeKeyword, likeKeyword, likeKeyword, likeKeyword)
		hasFilter = true
	}

	if !hasFilter {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keyword or module is required"})
		return
	}

	// 执行查询
	if err := query.
		Order("sort ASC").
		Limit(limit).
		Offset(offset).
		Find(&navItems).Error; err != nil {
		zap.L().Error("搜索失败", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "search failed"})
		return
	}

	// 4. 返回结果（admin 前端期望 { links: [...] } 格式）
	if module != "" || id != "" {
		c.JSON(http.StatusOK, gin.H{"links": navItemsToLinkDTOs(navItems)})
	} else {
		c.JSON(http.StatusOK, navItemsToLinkDTOs(navItems))
	}
}
