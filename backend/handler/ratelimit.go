// handler/ratelimit.go
package handler

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// rateLimiter 是一个轻量级的「滑动窗口」按 key（默认按客户端 IP）限流器，
// 无需引入额外依赖。用于保护 /register、/login 等公开写接口免遭暴力尝试。
type rateLimiter struct {
	mu       sync.Mutex
	hits     map[string][]time.Time
	limit    int
	window   time.Duration
	lastSwes time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		hits:   make(map[string][]time.Time),
		limit:  limit,
		window: window,
	}
}

// allow 判断给定 key 在窗口内是否仍在配额内，并记录本次访问。
func (r *rateLimiter) allow(key string, now time.Time) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	cutoff := now.Add(-r.window)
	// 周期性清理过期 key，避免内存无限增长。
	if now.Sub(r.lastSwes) > r.window {
		for k, ts := range r.hits {
			if len(ts) == 0 || ts[len(ts)-1].Before(cutoff) {
				delete(r.hits, k)
			}
		}
		r.lastSwes = now
	}

	recent := r.hits[key][:0]
	for _, t := range r.hits[key] {
		if t.After(cutoff) {
			recent = append(recent, t)
		}
	}
	if len(recent) >= r.limit {
		r.hits[key] = recent
		return false
	}
	r.hits[key] = append(recent, now)
	return true
}

// RateLimit 返回一个按客户端 IP 限流的中间件。超限返回 429。
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	limiter := newRateLimiter(limit, window)
	return func(c *gin.Context) {
		if !limiter.allow(c.ClientIP(), time.Now()) {
			c.JSON(http.StatusTooManyRequests, gin.H{"msg": "请求过于频繁，请稍后再试"})
			c.Abort()
			return
		}
		c.Next()
	}
}
