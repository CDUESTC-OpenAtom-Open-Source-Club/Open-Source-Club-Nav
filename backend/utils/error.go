package utils

import (
	"net/http"
)

// 定义错误类型（后续统一错误格式时可以扩展）
type APIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *APIError) Error() string {
	return e.Message
}

// 快捷创建错误的函数
func ErrInvalidParam(msg string) error {
	return &APIError{Code: http.StatusBadRequest, Message: msg}
}

func ErrUnauthorized(msg string) error {
	return &APIError{Code: http.StatusUnauthorized, Message: msg}
}

func ErrInternal(msg string) error {
	return &APIError{Code: http.StatusInternalServerError, Message: msg}
}

// 新增：获取错误对应的HTTP状态码
func ErrStatusCode(err error) int {
	if apiErr, ok := err.(*APIError); ok {
		return apiErr.Code
	}
	// 默认500
	return http.StatusInternalServerError
}
