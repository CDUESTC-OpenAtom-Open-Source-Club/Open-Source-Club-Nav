// handler/healthz.go
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthzHandler 轻量级健康检查，供 Docker/负载均衡器探活使用。
func HealthzHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
