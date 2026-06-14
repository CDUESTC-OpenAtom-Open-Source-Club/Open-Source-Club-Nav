// handler/works_handler.go
package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"open-source-club-nav/backend/model"
	"open-source-club-nav/backend/utils"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var workColors = []string{"#0A84FF", "#06E5CC", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#38BDF8", "#EC4899"}

// GetPublicWorks 获取前台展示的作品列表（仅 is_featured=1）
func GetPublicWorks(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	// 尝试从 GitHub API 拉取
	works, err := fetchGitHubRepos(db)
	if err == nil && len(works) > 0 {
		c.JSON(http.StatusOK, gin.H{"works": works, "source": "github"})
		return
	}
	if err != nil {
		utils.Logger.Warn("GitHub API 不可用", zap.Error(err))
	}

	// GitHub 失败时查询数据库
	var dbWorks []model.Work
	if err := db.Where("is_featured = 1").Order("display_order ASC, id ASC").Find(&dbWorks).Error; err == nil && len(dbWorks) > 0 {
		c.JSON(http.StatusOK, gin.H{"works": dbWorks, "source": "mysql"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"works": []model.Work{}, "source": "fallback"})
}

// GetWorkByID 获取单个作品详情
func GetWorkByID(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ID"})
		return
	}

	var work model.Work
	if err := db.First(&work, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "作品不存在"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"work": work})
}

// UpdateWork 更新作品（支持 PATCH 部分更新）
func UpdateWork(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ID"})
		return
	}

	var work model.Work
	if err := db.First(&work, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "作品不存在"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体解析失败"})
		return
	}

	// 允许更新的字段
	allowedFields := map[string]string{
		"type": "type", "repo_url": "repo_url", "title": "title",
		"description": "description", "author_name": "author_name",
		"author_avatar": "author_avatar", "tags": "tags", "color": "color",
		"status": "status", "stars": "stars", "preview_url": "preview_url",
		"is_featured": "is_featured", "display_order": "display_order",
	}

	updates := make(map[string]interface{})
	for jsonKey, dbField := range allowedFields {
		if val, ok := body[jsonKey]; ok {
			if jsonKey == "tags" {
				if tagSlice, ok := val.([]interface{}); ok {
					tags := make([]string, 0, len(tagSlice))
					for _, t := range tagSlice {
						tags = append(tags, fmt.Sprintf("%v", t))
					}
					tagBytes, _ := json.Marshal(tags)
					updates[dbField] = json.RawMessage(tagBytes)
				} else if tagStr, ok := val.(string); ok {
					updates[dbField] = json.RawMessage(tagStr)
				}
			} else if jsonKey == "is_featured" {
				updates[dbField] = val
			} else {
				updates[dbField] = val
			}
		}
	}

	if len(updates) > 0 {
		db.Model(&work).Updates(updates)
		logAction(db, c, "update_work", &work.ID, "更新作品: "+work.Title)
	}

	db.First(&work, id)
	c.JSON(http.StatusOK, gin.H{"work": work})
}

// GetAllWorks 获取所有作品（管理后台用）
func GetAllWorks(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var works []model.Work
	if err := db.Order("display_order ASC, id ASC").Find(&works).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"works": works})
}

// CreateWork 新增作品
func CreateWork(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)

	var input struct {
		Type         string   `json:"type"`
		RepoURL      *string  `json:"repo_url"`
		Title        string   `json:"title"`
		Description  string   `json:"description"`
		AuthorName   string   `json:"author_name"`
		AuthorAvatar *string  `json:"author_avatar"`
		Tags         []string `json:"tags"`
		Color        string   `json:"color"`
		Status       string   `json:"status"`
		Stars        int      `json:"stars"`
		PreviewURL   *string  `json:"preview_url"`
		IsFeatured   *int8    `json:"is_featured"`
		DisplayOrder int      `json:"display_order"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求体解析失败"})
		return
	}

	if input.Title == "" || input.AuthorName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title 和 author_name 为必填项"})
		return
	}

	authorAvatar := ""
	if input.AuthorAvatar != nil {
		authorAvatar = *input.AuthorAvatar
	}
	if authorAvatar == "" {
		runes := []rune(input.AuthorName)
		if len(runes) >= 2 {
			authorAvatar = string(runes[:2])
		} else {
			authorAvatar = input.AuthorName
		}
	}

	tagsJSON, _ := json.Marshal(input.Tags)
	if input.Tags == nil {
		tagsJSON, _ = json.Marshal([]string{})
	}
	tagsRaw := json.RawMessage(tagsJSON)
	// --- 新增解析逻辑 ---
	var parsedTags model.Tags
	if err := json.Unmarshal(tagsRaw, &parsedTags); err != nil {
		parsedTags = model.Tags{}
	}

	featured := int8(1)
	if input.IsFeatured != nil {
		featured = *input.IsFeatured
	}

	workType := input.Type
	if workType == "" {
		workType = "MANUAL"
	}

	work := model.Work{
		Type:         workType,
		Title:        input.Title,
		Description:  input.Description,
		AuthorName:   input.AuthorName,
		AuthorAvatar: &authorAvatar,
		Tags:         parsedTags,
		Color:        input.Color,
		Status:       input.Status,
		Stars:        input.Stars,
		IsFeatured:   featured,
		DisplayOrder: input.DisplayOrder,
	}
	if input.RepoURL != nil {
		work.RepoURL = input.RepoURL
	}
	if input.PreviewURL != nil {
		work.PreviewURL = input.PreviewURL
	}
	if work.Color == "" {
		work.Color = "#0A84FF"
	}
	if work.Status == "" {
		work.Status = "开发中"
	}

	// 如果是 GitHub 类型且有 repo_url，尝试从 GitHub 补全信息
	if workType == "GITHUB" && input.RepoURL != nil && *input.RepoURL != "" {
		enrichFromGitHub(&work, *input.RepoURL)
	}

	if err := db.Create(&work).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	logAction(db, c, "create_work", &work.ID, "新增作品: "+work.Title)

	c.JSON(http.StatusCreated, gin.H{"work": work})
}

// DeleteWork 删除作品
func DeleteWork(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的 ID"})
		return
	}

	result := db.Delete(&model.Work{}, id)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "作品不存在"})
		return
	}

	uid := uint(id)
	logAction(db, c, "delete_work", &uid, "删除作品 ID: "+strconv.FormatUint(id, 10))

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// SyncGitHubWorks 同步 GitHub 组织仓库到 works 表
func SyncGitHubWorks(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	now := time.Now()

	repos, err := fetchGitHubRepoList()
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "GitHub API 不可用", "detail": err.Error()})
		return
	}

	synced := 0

	for i, repo := range repos {
		if isFork, _ := repo["fork"].(bool); isFork {
			continue
		}

		htmlURL, _ := repo["html_url"].(string)
		name, _ := repo["name"].(string)
		description, _ := repo["description"].(string)
		ownerLogin := githubOrgFromEnv()
		if owner, ok := repo["owner"].(map[string]interface{}); ok {
			if login, ok := owner["login"].(string); ok {
				ownerLogin = login
			}
		}

		var tagsRaw json.RawMessage
		if lang, ok := repo["language"].(string); ok && lang != "" {
			b, _ := json.Marshal([]string{lang})
			tagsRaw = json.RawMessage(b)
		} else {
			tagsRaw = json.RawMessage("[]")
		}
		// --- 新增解析tagsRaw的逻辑 ---
		var parsedTags model.Tags
		if err := json.Unmarshal(tagsRaw, &parsedTags); err != nil {
			parsedTags = model.Tags{} // 解析失败给空值
		}

		archived := false
		if a, ok := repo["archived"].(bool); ok {
			archived = a
		}
		status := "开发中"
		if archived {
			status = "已归档"
		}

		stars := 0
		if s, ok := repo["stargazers_count"].(float64); ok {
			stars = int(s)
		}

		var homepage *string
		if h, ok := repo["homepage"].(string); ok && h != "" {
			homepage = &h
		}

		authorAvatar := ownerLogin
		runes := []rune(ownerLogin)
		if len(runes) >= 2 {
			authorAvatar = string(runes[:2])
		}
		color := workColors[i%len(workColors)]

		var work model.Work
		result := db.Where("repo_url = ?", htmlURL).First(&work)
		if result.Error == gorm.ErrRecordNotFound {
			work = model.Work{
				Type:         "GITHUB",
				RepoURL:      &htmlURL,
				Title:        name,
				Description:  description,
				AuthorName:   ownerLogin,
				AuthorAvatar: &authorAvatar,
				Tags:         parsedTags,
				Color:        color,
				Status:       status,
				Stars:        stars,
				PreviewURL:   homepage,
				IsFeatured:   1,
				DisplayOrder: i + 1,
				LastSyncedAt: &now,
			}
			db.Create(&work)
			synced++
		} else {
			db.Model(&work).Updates(map[string]interface{}{
				"title":          name,
				"description":    description,
				"stars":          stars,
				"tags":           parsedTags,
				"status":         status,
				"last_synced_at": now,
			})
			synced++
		}
	}

	logAction(db, c, "sync_works", nil, fmt.Sprintf("同步 GitHub 仓库: %d/%d", synced, len(repos)))

	c.JSON(http.StatusOK, gin.H{"synced": synced, "total": len(repos)})
}

// fetchGitHubRepos 从 GitHub 获取组织仓库列表并转为 Work
func fetchGitHubRepos(db *gorm.DB) ([]model.Work, error) {
	repos, err := fetchGitHubRepoList()
	if err != nil {
		return nil, err
	}

	var works []model.Work

	for i, repo := range repos {
		if isFork, _ := repo["fork"].(bool); isFork {
			continue
		}
		htmlURL, _ := repo["html_url"].(string)
		name, _ := repo["name"].(string)
		description, _ := repo["description"].(string)
		ownerLogin := githubOrgFromEnv()
		if owner, ok := repo["owner"].(map[string]interface{}); ok {
			if login, ok := owner["login"].(string); ok {
				ownerLogin = login
			}
		}

		var tagsRaw json.RawMessage
		if lang, ok := repo["language"].(string); ok && lang != "" {
			b, _ := json.Marshal([]string{lang})
			tagsRaw = json.RawMessage(b)
		} else {
			tagsRaw = json.RawMessage("[]")
		}

		// --- 解析tagsRaw为model.Tags（调整到这里，不在if archived块里）---
		var parsedTags model.Tags
		if err := json.Unmarshal(tagsRaw, &parsedTags); err != nil {
			parsedTags = model.Tags{} // 解析失败给空值
		}

		archived := false
		if a, ok := repo["archived"].(bool); ok {
			archived = a
		}
		status := "开发中"
		if archived {
			status = "已归档"
		}

		stars := 0
		if s, ok := repo["stargazers_count"].(float64); ok {
			stars = int(s)
		}

		var previewURL *string
		if h, ok := repo["homepage"].(string); ok && h != "" {
			previewURL = &h
		}

		authorAvatar := ownerLogin
		runes := []rune(ownerLogin)
		if len(runes) >= 2 {
			authorAvatar = string(runes[:2])
		}

		work := model.Work{
			ID:           uint(i + 1),
			Type:         "GITHUB",
			RepoURL:      &htmlURL,
			Title:        name,
			Description:  description,
			AuthorName:   ownerLogin,
			AuthorAvatar: &authorAvatar,
			Tags:         parsedTags, // 替换为解析后的parsedTags
			Color:        workColors[i%len(workColors)],
			Status:       status,
			Stars:        stars,
			PreviewURL:   previewURL,
			IsFeatured:   1,
			DisplayOrder: i + 1,
		}
		works = append(works, work)
	}

	return works, nil
}

// fetchGitHubRepoList 调用 GitHub API 获取组织仓库列表
func fetchGitHubRepoList() ([]map[string]interface{}, error) {
	url := fmt.Sprintf("https://api.github.com/orgs/%s/repos?per_page=100&sort=updated", githubOrgFromEnv())
	return fetchGitHubArray(url, githubHeaders())
}

// enrichFromGitHub 从 GitHub API 补全作品信息
func enrichFromGitHub(work *model.Work, repoURL string) {
	// 解析 owner/repo
	parts := strings.Split(strings.TrimPrefix(repoURL, "https://github.com/"), "/")
	if len(parts) < 2 {
		return
	}
	owner, repo := parts[0], parts[1]

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", owner, repo)
	data, err := fetchGitHubObject(url, githubHeaders())
	if err != nil {
		return
	}

	if name, ok := data["name"].(string); ok && work.Title == "" {
		work.Title = name
	}
	if desc, ok := data["description"].(string); ok && work.Description == "" {
		work.Description = desc
	}
	if stars, ok := data["stargazers_count"].(float64); ok {
		work.Stars = int(stars)
	}
	if lang, ok := data["language"].(string); ok && lang != "" {
		b, _ := json.Marshal([]string{lang})
		tagsRaw := json.RawMessage(b)
		// 解析tagsRaw为model.Tags
		var parsedTags model.Tags
		if err := json.Unmarshal(tagsRaw, &parsedTags); err != nil {
			parsedTags = model.Tags{}
		}
		work.Tags = parsedTags
	}
}
