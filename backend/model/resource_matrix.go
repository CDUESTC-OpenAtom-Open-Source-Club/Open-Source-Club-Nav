// model/resource_matrix.go
package model

import "gorm.io/gorm"

// ResourceMatrix 资源矩阵表（比如开源工具、文档分类）
type ResourceMatrix struct {
	gorm.Model        // 自带ID/时间
	Category   string `json:"category" gorm:"size:100;not null"` // 资源分类（如“开发工具”）
	Name       string `json:"name" gorm:"size:255;not null"`     // 资源名称
	Url        string `json:"url" gorm:"size:500;not null"`      // 资源链接
	Desc       string `json:"desc" gorm:"type:text"`             // 资源描述
	Tag        string `json:"tag" gorm:"size:200"`               // 标签（如“免费/开源”）
}

// 关键：手动指定表名（覆盖GORM的默认复数规则）
func (ResourceMatrix) TableName() string {
	return "resource_matrix"
}
