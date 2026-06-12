package handler

import (
	"context"
	"net/http"
	"open-source-club-nav/backend/config"
	"open-source-club-nav/backend/service"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AdminCheckDeployUpdates(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	status, err := service.CheckDeployUpdates(ctx, config.GetConfig())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  err.Error(),
			"status": status,
		})
		return
	}
	c.JSON(http.StatusOK, status)
}

func AdminTriggerDeploy(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
	defer cancel()

	status, err := service.TriggerDeployUpdate(ctx, config.GetConfig())
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":  err.Error(),
			"status": status,
		})
		return
	}

	if db, ok := c.Get("db"); ok {
		if gormDB, ok := db.(*gorm.DB); ok {
			logAction(gormDB, c, "trigger_deploy", nil, "触发 tag 自动部署: "+status.LatestTag)
		}
	}

	c.JSON(http.StatusAccepted, status)
}

func AdminDeployStatus(c *gin.Context) {
	c.JSON(http.StatusOK, service.GetDeployStatus(config.GetConfig()))
}
