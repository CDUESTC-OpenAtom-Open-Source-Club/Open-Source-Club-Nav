// model/misc.go
package model

type Misc struct {
	ID    uint   `gorm:"primaryKey"`       
	Other string `gorm:"column:other"`     
}

func (Misc) TableName() string {
	return "misc"
}
