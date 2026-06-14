package handler

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"open-source-club-nav/backend/utils"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

var githubHTTPClient = &http.Client{
	Timeout: 12 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        32,
		MaxIdleConnsPerHost: 8,
		IdleConnTimeout:     90 * time.Second,
	},
}

func fetchGitHubJSON(url string, headers map[string]string, target interface{}) error {
	ttl := githubCacheTTL(url)
	if ttl <= 0 || utils.RedisClient == nil {
		return fetchGitHubJSONRemote(url, headers, target)
	}

	key := githubCacheKey(url)
	cached, err := githubCacheGet(key)
	if err == nil {
		if unmarshalErr := json.Unmarshal(cached, target); unmarshalErr == nil {
			return nil
		}
		githubCacheDelete(key)
	} else if err != redis.Nil {
		utils.Logger.Warn("读取 GitHub 缓存失败", zap.String("key", key), zap.Error(err))
	}

	if err := fetchGitHubJSONRemote(url, headers, target); err != nil {
		return err
	}

	payload, err := json.Marshal(target)
	if err != nil {
		return nil
	}
	if err := githubCacheSet(key, payload, ttl); err != nil {
		utils.Logger.Warn("写入 GitHub 缓存失败", zap.String("key", key), zap.Error(err))
	}
	return nil
}

func githubCacheGet(key string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	return utils.RedisClient.Get(ctx, key).Bytes()
}

func githubCacheSet(key string, payload []byte, ttl time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	return utils.RedisClient.Set(ctx, key, payload, ttl).Err()
}

func githubCacheDelete(key string) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	_ = utils.RedisClient.Del(ctx, key).Err()
}

func fetchGitHubJSONRemote(url string, headers map[string]string, target interface{}) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := githubHTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("github returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return err
	}
	return json.Unmarshal(body, target)
}

func githubCacheKey(url string) string {
	sum := sha256.Sum256([]byte(url))
	return "github:api:" + hex.EncodeToString(sum[:])
}

func githubCacheTTL(url string) time.Duration {
	if ttl := envDuration("GITHUB_CACHE_TTL", 0); ttl > 0 {
		return ttl
	}

	switch {
	case strings.Contains(url, "/events"):
		return envDuration("GITHUB_EVENTS_CACHE_TTL", 5*time.Minute)
	case strings.Contains(url, "/contributors"):
		return envDuration("GITHUB_CONTRIBUTORS_CACHE_TTL", 6*time.Hour)
	case strings.Contains(url, "/users/"):
		return envDuration("GITHUB_USERS_CACHE_TTL", time.Hour)
	case strings.Contains(url, "/orgs/") && strings.Contains(url, "/repos"):
		return envDuration("GITHUB_REPOS_CACHE_TTL", 30*time.Minute)
	case strings.Contains(url, "/orgs/"):
		return envDuration("GITHUB_ORG_CACHE_TTL", time.Hour)
	case strings.Contains(url, "/repos/"):
		return envDuration("GITHUB_REPO_CACHE_TTL", 30*time.Minute)
	default:
		return envDuration("GITHUB_DEFAULT_CACHE_TTL", 30*time.Minute)
	}
}

func envDuration(name string, fallback time.Duration) time.Duration {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return fallback
	}
	if duration, err := time.ParseDuration(raw); err == nil {
		return duration
	}
	seconds, err := strconv.Atoi(raw)
	if err != nil || seconds < 0 {
		return fallback
	}
	return time.Duration(seconds) * time.Second
}
