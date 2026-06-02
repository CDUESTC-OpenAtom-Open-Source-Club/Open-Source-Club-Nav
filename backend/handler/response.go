package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Code int         `json:"code"`
	Msg  string      `json:"msg"`
	Data interface{} `json:"data,omitempty"`
}

// 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Code: 200,
		Msg:  "success",
		Data: data,
	})
}

// 错误响应（过滤内部错误）
func Fail(c *gin.Context, code int, msg string) {
	if strings.Contains(msg, "sql:") || strings.Contains(msg, "gorm:") {
		msg = "系统服务异常，请稍后重试"
	}
	c.JSON(code, APIResponse{
		Code: code,
		Msg:  msg,
	})
}
