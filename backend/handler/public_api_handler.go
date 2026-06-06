package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const githubAPIBase = "https://api.github.com"

var (
	githubLoginPattern = regexp.MustCompile(`^[A-Za-z0-9-]{1,39}$`)
	githubRepoPattern  = regexp.MustCompile(`^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`)
	supportedEventType = map[string]bool{
		"PushEvent":                     true,
		"PullRequestEvent":              true,
		"PullRequestReviewEvent":        true,
		"PullRequestReviewCommentEvent": true,
		"CreateEvent":                   true,
		"DeleteEvent":                   true,
		"IssuesEvent":                   true,
		"ReleaseEvent":                  true,
		"ForkEvent":                     true,
		"WatchEvent":                    true,
		"IssueCommentEvent":             true,
	}
	eventColors = map[string]string{
		"PushEvent":                     "#0A84FF",
		"PullRequestEvent":              "#06E5CC",
		"PullRequestReviewEvent":        "#14B8A6",
		"PullRequestReviewCommentEvent": "#0EA5E9",
		"CreateEvent":                   "#7C3AED",
		"DeleteEvent":                   "#EF4444",
		"IssuesEvent":                   "#F59E0B",
		"ReleaseEvent":                  "#10B981",
		"ForkEvent":                     "#EC4899",
		"WatchEvent":                    "#38BDF8",
		"IssueCommentEvent":             "#F97316",
	}
)

func GetPublicSystem(c *gin.Context) {
	hostname, _ := os.Hostname()
	now := time.Now()
	uptimeSec := int(time.Since(processStartedAt).Seconds())

	c.JSON(http.StatusOK, gin.H{
		"now":       now.Format(time.RFC3339),
		"serverNow": now.Format(time.RFC3339),
		"timezone":  time.Local.String(),
		"hostname":  hostname,
		"uptimeSec": uptimeSec,
		"startedAt": processStartedAt.Format(time.RFC3339),
		"goVersion": runtime.Version(),
		"status":    "ok",
	})
}

func GetOrgStats(c *gin.Context) {
	org := githubOrgFromEnv()
	headers := githubHeaders()

	orgData, err1 := fetchGitHubObject(fmt.Sprintf("%s/orgs/%s", githubAPIBase, org), headers)
	members, err2 := fetchGitHubArray(fmt.Sprintf("%s/orgs/%s/members?per_page=100", githubAPIBase, org), headers)
	repos, err3 := fetchGitHubArray(fmt.Sprintf("%s/orgs/%s/repos?per_page=100", githubAPIBase, org), headers)
	if err1 == nil && err2 == nil && err3 == nil {
		totalStars := 0
		for _, repo := range repos {
			totalStars += int(getFloat(repo, "stargazers_count"))
		}
		memberCount := int(getFloat(orgData, "public_members_count"))
		if memberCount == 0 {
			memberCount = len(members)
		}
		c.JSON(http.StatusOK, gin.H{
			"members":  memberCount,
			"projects": len(repos),
			"stars":    totalStars,
			"source":   "github",
		})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var projects int64
	var stars int64
	db.Table("works").Count(&projects)
	db.Table("works").Select("COALESCE(SUM(stars), 0)").Scan(&stars)
	c.JSON(http.StatusOK, gin.H{
		"members":  0,
		"projects": projects,
		"stars":    stars,
		"source":   "database-fallback",
	})
}

func GetGitHubUsers(c *gin.Context) {
	logins := normalizeCSV(c.Query("logins"), 20, githubLoginPattern)
	if len(logins) == 0 {
		c.JSON(http.StatusOK, gin.H{"users": gin.H{}, "source": "github"})
		return
	}

	headers := githubHeaders()
	users := gin.H{}
	for _, login := range logins {
		data, err := fetchGitHubObject(fmt.Sprintf("%s/users/%s", githubAPIBase, login), headers)
		if err != nil {
			continue
		}
		users[login] = gin.H{
			"login":     firstString(getString(data, "login"), login),
			"name":      getString(data, "name"),
			"avatarUrl": firstString(getString(data, "avatar_url"), fmt.Sprintf("https://github.com/%s.png?size=160", login)),
			"htmlUrl":   firstString(getString(data, "html_url"), fmt.Sprintf("https://github.com/%s", login)),
			"blog":      getString(data, "blog"),
		}
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "source": "github"})
}

func GetGitHubContributors(c *gin.Context) {
	repos := normalizeCSV(c.Query("repos"), 12, githubRepoPattern)
	if len(repos) == 0 {
		c.JSON(http.StatusOK, gin.H{"contributors": gin.H{}, "source": "github"})
		return
	}

	headers := githubHeaders()
	contributors := gin.H{}
	for _, repo := range repos {
		data, err := fetchGitHubArray(fmt.Sprintf("%s/repos/%s/contributors", githubAPIBase, repo), headers)
		if err != nil {
			contributors[repo] = []gin.H{}
			continue
		}
		list := make([]gin.H, 0, min(len(data), 5))
		for _, item := range data[:min(len(data), 5)] {
			list = append(list, gin.H{
				"login":         getString(item, "login"),
				"avatar":        getString(item, "avatar_url"),
				"url":           getString(item, "html_url"),
				"contributions": int(getFloat(item, "contributions")),
			})
		}
		contributors[repo] = list
	}

	c.JSON(http.StatusOK, gin.H{"contributors": contributors, "source": "github"})
}

func GetActivities(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	org := githubOrgFromEnv()
	headers := githubHeaders()
	events, err := fetchGitHubArray(fmt.Sprintf("%s/orgs/%s/events?per_page=%d", githubAPIBase, org, limit), headers)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"activities": []gin.H{}, "source": "fallback"})
		return
	}

	activities := make([]gin.H, 0, limit)
	for _, event := range events {
		eventType := getString(event, "type")
		if !supportedEventType[eventType] {
			continue
		}
		activities = append(activities, mapGitHubEvent(event))
		if len(activities) >= limit {
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"activities": activities, "source": "github"})
}

var processStartedAt = time.Now()

func githubOrgFromEnv() string {
	if org := os.Getenv("GITHUB_ORG"); org != "" {
		return org
	}
	if org := os.Getenv("NEXT_PUBLIC_GITHUB_ORG"); org != "" {
		return org
	}
	return githubOrg
}

func githubHeaders() map[string]string {
	headers := map[string]string{
		"Accept":     "application/vnd.github+json",
		"User-Agent": "OpenAtom-Club-Nav",
	}
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		headers["Authorization"] = "Bearer " + token
	}
	return headers
}

func fetchGitHubObject(url string, headers map[string]string) (map[string]interface{}, error) {
	var payload map[string]interface{}
	if err := fetchGitHubJSON(url, headers, &payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func fetchGitHubArray(url string, headers map[string]string) ([]map[string]interface{}, error) {
	var payload []map[string]interface{}
	if err := fetchGitHubJSON(url, headers, &payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func fetchGitHubJSON(url string, headers map[string]string, target interface{}) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("github returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	return json.Unmarshal(body, target)
}

func normalizeCSV(value string, max int, pattern *regexp.Regexp) []string {
	seen := map[string]bool{}
	items := []string{}
	for _, raw := range strings.Split(value, ",") {
		item := strings.TrimSpace(raw)
		if item == "" || !pattern.MatchString(item) || seen[item] {
			continue
		}
		seen[item] = true
		items = append(items, item)
		if len(items) >= max {
			break
		}
	}
	return items
}

func mapGitHubEvent(event map[string]interface{}) gin.H {
	eventType := getString(event, "type")
	actor := getMap(event, "actor")
	repo := getMap(event, "repo")
	payload := getMap(event, "payload")
	createdAt := getString(event, "created_at")
	repoName := firstString(getString(repo, "name"), "unknown/repo")

	branch := getBranch(payload)
	message := getEventMessage(eventType, payload, branch)
	details := getEventDetails(eventType, payload)

	return gin.H{
		"id":         firstString(getString(event, "id"), fmt.Sprintf("evt_%d", time.Now().UnixNano())),
		"type":       eventType,
		"actor":      gin.H{"login": firstString(getString(actor, "login"), "github-user"), "avatar": avatarLetters(getString(actor, "login")), "avatarUrl": getString(actor, "avatar_url"), "profileUrl": getString(actor, "html_url")},
		"repo":       repoName,
		"repoUrl":    "https://github.com/" + repoName,
		"message":    message,
		"details":    details,
		"branch":     emptyToNil(branch),
		"commits":    commitCount(payload),
		"isMergedPr": eventType == "PullRequestEvent" && getString(payload, "action") == "closed" && getBool(getMap(payload, "pull_request"), "merged"),
		"time":       relativeTime(createdAt),
		"color":      firstString(eventColors[eventType], "#0A84FF"),
		"createdAt":  emptyToNil(createdAt),
		"linkUrl":    emptyToNil(eventLink(eventType, payload)),
	}
}

func getEventMessage(eventType string, payload map[string]interface{}, branch string) string {
	switch eventType {
	case "PushEvent":
		count := commitCount(payload)
		if branch != "" && count > 0 {
			return fmt.Sprintf("push to %s · %d commit%s", branch, count, plural(count))
		}
		if branch != "" {
			return "push to " + branch
		}
		return "push update"
	case "PullRequestEvent":
		pr := getMap(payload, "pull_request")
		return fmt.Sprintf("PR %s: %s", firstString(getString(payload, "action"), "updated"), firstString(getString(pr, "title"), "pull request"))
	case "PullRequestReviewEvent":
		pr := getMap(payload, "pull_request")
		return fmt.Sprintf("review %s: %s", strings.ToLower(firstString(getString(payload, "action"), "reviewed")), firstString(getString(pr, "title"), "pull request"))
	case "PullRequestReviewCommentEvent":
		pr := getMap(payload, "pull_request")
		return fmt.Sprintf("review comment %s: %s", firstString(getString(payload, "action"), "commented"), firstString(getString(pr, "title"), "pull request"))
	case "CreateEvent":
		return strings.TrimSpace(fmt.Sprintf("create %s %s", firstString(getString(payload, "ref_type"), "resource"), getString(payload, "ref")))
	case "DeleteEvent":
		return strings.TrimSpace(fmt.Sprintf("delete %s %s", firstString(getString(payload, "ref_type"), "resource"), getString(payload, "ref")))
	case "IssuesEvent":
		issue := getMap(payload, "issue")
		label := "issue"
		if _, ok := issue["pull_request"]; ok {
			label = "pull request"
		}
		return fmt.Sprintf("%s %s: %s", label, firstString(getString(payload, "action"), "updated"), firstString(getString(issue, "title"), label))
	case "IssueCommentEvent":
		issue := getMap(payload, "issue")
		return fmt.Sprintf("comment %s: %s", firstString(getString(payload, "action"), "commented"), firstString(getString(issue, "title"), "issue"))
	case "ReleaseEvent":
		release := getMap(payload, "release")
		return "release: " + firstString(getString(release, "tag_name"), "release")
	case "ForkEvent":
		forkee := getMap(payload, "forkee")
		if name := getString(forkee, "full_name"); name != "" {
			return "forked to " + name
		}
		return "fork repository"
	case "WatchEvent":
		return "starred repository"
	default:
		return strings.TrimSuffix(eventType, "Event")
	}
}

func getEventDetails(eventType string, payload map[string]interface{}) []string {
	switch eventType {
	case "PushEvent":
		commits := getSlice(payload, "commits")
		details := []string{}
		for _, commit := range commits {
			if message := truncate(strings.Split(getString(asMap(commit), "message"), "\n")[0], 88); message != "" {
				details = append(details, message)
			}
			if len(details) >= 4 {
				break
			}
		}
		return details
	case "PullRequestEvent":
		pr := getMap(payload, "pull_request")
		return compactStrings([]string{
			"action: " + firstString(getString(payload, "action"), "updated"),
			prefixIf("state: ", getString(pr, "state")),
			prefixIf("base: ", getString(getMap(pr, "base"), "ref")),
			prefixIf("head: ", getString(getMap(pr, "head"), "ref")),
		})
	case "CreateEvent", "DeleteEvent":
		return compactStrings([]string{
			prefixIf("type: ", getString(payload, "ref_type")),
			prefixIf("ref: ", getString(payload, "ref")),
		})
	case "IssuesEvent":
		issue := getMap(payload, "issue")
		return compactStrings([]string{
			prefixIf("action: ", getString(payload, "action")),
			prefixIf("state: ", getString(issue, "state")),
		})
	case "ReleaseEvent":
		release := getMap(payload, "release")
		return compactStrings([]string{
			prefixIf("tag: ", getString(release, "tag_name")),
			truncate(getString(release, "name"), 88),
		})
	case "ForkEvent":
		forkee := getMap(payload, "forkee")
		return compactStrings([]string{prefixIf("target: ", getString(forkee, "full_name"))})
	case "WatchEvent":
		return []string{"action: " + firstString(getString(payload, "action"), "started")}
	default:
		return []string{}
	}
}

func eventLink(eventType string, payload map[string]interface{}) string {
	switch eventType {
	case "PullRequestEvent", "PullRequestReviewEvent", "PullRequestReviewCommentEvent":
		return getString(getMap(payload, "pull_request"), "html_url")
	case "IssuesEvent", "IssueCommentEvent":
		return getString(getMap(payload, "issue"), "html_url")
	case "ReleaseEvent":
		return getString(getMap(payload, "release"), "html_url")
	case "ForkEvent":
		return getString(getMap(payload, "forkee"), "html_url")
	default:
		return ""
	}
}

func getBranch(payload map[string]interface{}) string {
	ref := firstString(getString(payload, "ref"), getString(payload, "master_branch"))
	return strings.TrimPrefix(ref, "refs/heads/")
}

func commitCount(payload map[string]interface{}) int {
	if commits := getSlice(payload, "commits"); len(commits) > 0 {
		return len(commits)
	}
	return int(getFloat(payload, "size"))
}

func relativeTime(value string) string {
	created, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return "刚刚"
	}
	diff := time.Since(created)
	if diff < 10*time.Second {
		return "刚刚"
	}
	if diff < time.Minute {
		return fmt.Sprintf("%d 秒前", int(diff.Seconds()))
	}
	if diff < time.Hour {
		return fmt.Sprintf("%d 分钟前", int(diff.Minutes()))
	}
	if diff < 24*time.Hour {
		return fmt.Sprintf("%d 小时前", int(diff.Hours()))
	}
	return fmt.Sprintf("%d 天前", int(diff.Hours()/24))
}

func avatarLetters(login string) string {
	if login == "" {
		return "GH"
	}
	parts := regexp.MustCompile(`[-_.\s]+`).Split(login, -1)
	if len(parts) >= 2 && parts[0] != "" && parts[1] != "" {
		return strings.ToUpper(parts[0][:1] + parts[1][:1])
	}
	if len(login) >= 2 {
		return strings.ToUpper(login[:2])
	}
	return strings.ToUpper(login)
}

func getMap(m map[string]interface{}, key string) map[string]interface{} {
	return asMap(m[key])
}

func asMap(value interface{}) map[string]interface{} {
	if m, ok := value.(map[string]interface{}); ok {
		return m
	}
	return map[string]interface{}{}
}

func getSlice(m map[string]interface{}, key string) []interface{} {
	if items, ok := m[key].([]interface{}); ok {
		return items
	}
	return []interface{}{}
}

func getString(m map[string]interface{}, key string) string {
	if value, ok := m[key].(string); ok {
		return value
	}
	return ""
}

func getBool(m map[string]interface{}, key string) bool {
	if value, ok := m[key].(bool); ok {
		return value
	}
	return false
}

func getFloat(m map[string]interface{}, key string) float64 {
	switch value := m[key].(type) {
	case float64:
		return value
	case int:
		return float64(value)
	case int64:
		return float64(value)
	default:
		return 0
	}
}

func firstString(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func compactStrings(values []string) []string {
	result := []string{}
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			result = append(result, value)
		}
	}
	return result
}

func prefixIf(prefix, value string) string {
	if value == "" {
		return ""
	}
	return prefix + value
}

func truncate(value string, max int) string {
	value = strings.TrimSpace(strings.Join(strings.Fields(value), " "))
	if len(value) <= max {
		return value
	}
	return value[:max-1] + "…"
}

func emptyToNil(value string) interface{} {
	if value == "" {
		return nil
	}
	return value
}

func plural(count int) string {
	if count == 1 {
		return ""
	}
	return "s"
}
