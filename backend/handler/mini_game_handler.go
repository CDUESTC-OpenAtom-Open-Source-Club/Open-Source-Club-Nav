package handler

import (
	"net/http"
	"open-source-club-nav/backend/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SearchMiniGame 查询小游戏列表
// 路由：GET /api/games
func SearchMiniGame(c *gin.Context) {
	// 获取数据库实例
	db := c.MustGet("db").(*gorm.DB)
	var games []model.MiniGame

	// （可选）添加查询条件（比如按游戏类型筛选）
	gameType := c.Query("game_type")
	query := db
	if gameType != "" {
		query = query.Where("game_type = ?", gameType).Order("sort ASC")
	} else {
		query = query.Order("sort ASC") // 默认按排序字段排序
	}

	// 查询数据
	if err := query.Find(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 返回结果（对齐上级格式）
	c.JSON(http.StatusOK, gin.H{
		"data":   games,
		"module": "mini_games",
		"ok":     true,
	})
}

// CreateMiniGame 新增小游戏
// 路由：POST /api/admin/games
func CreateMiniGame(c *gin.Context) {
	// 绑定请求体参数
	var req struct {
		GameType string `json:"game_type" binding:"required"` // 游戏类型（必填）
		Name     string `json:"name" binding:"required"`      // 游戏名称（必填）
		CoverUrl string `json:"cover_url"`                    // 封面图链接（可选）
		PlayUrl  string `json:"play_url" binding:"required"`  // 游玩链接（必填）
		Status   int    `json:"status" binding:"oneof=0 1"`   // 状态：0=下线，1=上线（可选，默认1）
		Sort     int    `json:"sort"`                         // 排序（可选，默认0）
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 补全默认值
	if req.Status == 0 {
		req.Status = 1 // 默认为上线状态
	}

	// 获取数据库实例
	db := c.MustGet("db").(*gorm.DB)
	// 构造小游戏对象
	game := model.MiniGame{
		GameType: req.GameType,
		Name:     req.Name,
		CoverUrl: req.CoverUrl,
		PlayUrl:  req.PlayUrl,
		Status:   req.Status,
		Sort:     req.Sort,
	}

	// 写入数据库
	if err := db.Create(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logAction(db, c, "create_game", &game.ID, "新增游戏: "+game.Name)

	// 返回成功结果
	c.JSON(http.StatusOK, gin.H{"data": game, "ok": true})
}

// UpdateMiniGame 编辑小游戏
// 路由：PUT /api/admin/games/:id
func UpdateMiniGame(c *gin.Context) {
	// 1. 获取要编辑的小游戏ID
	id := c.Param("id")

	// 2. 绑定请求体参数
	var req struct {
		GameType string `json:"game_type"`
		Name     string `json:"name"`
		CoverUrl string `json:"cover_url"`
		PlayUrl  string `json:"play_url"`
		Status   int    `json:"status" binding:"omitempty,oneof=0 1"`
		Sort     int    `json:"sort"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. 查询要编辑的小游戏
	db := c.MustGet("db").(*gorm.DB)
	var game model.MiniGame
	if err := db.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "小游戏不存在"})
		return
	}

	// 4. 更新字段（只更新传了值的字段）
	if req.GameType != "" {
		game.GameType = req.GameType
	}
	if req.Name != "" {
		game.Name = req.Name
	}
	if req.CoverUrl != "" {
		game.CoverUrl = req.CoverUrl
	}
	if req.PlayUrl != "" {
		game.PlayUrl = req.PlayUrl
	}
	if req.Status != 0 {
		game.Status = req.Status
	}
	game.Sort = req.Sort

	// 5. 保存更新
	if err := db.Save(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logAction(db, c, "update_game", &game.ID, "更新游戏: "+game.Name)

	// 6. 返回结果
	c.JSON(http.StatusOK, gin.H{"data": game, "ok": true})
}

// DeleteMiniGame 删除小游戏（DELETE /api/admin/games/:id 或 ?id=X）
func DeleteMiniGame(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	id := c.Param("id")
	if id == "" {
		id = c.Query("id")
	}
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少游戏 ID"})
		return
	}

	var game model.MiniGame
	if err := db.First(&game, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "小游戏不存在"})
		return
	}

	if err := db.Delete(&game).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除失败"})
		return
	}

	logAction(db, c, "delete_game", &game.ID, "删除游戏: "+game.Name)

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
