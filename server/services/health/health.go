package health

import "time"

type Service struct{}

func NewService() *Service {
	return &Service{}
}

type Status struct {
	Status string    `json:"status"`
	Time   time.Time `json:"time"`
}

func (s *Service) Check() Status {
	return Status{
		Status: "ok",
		Time:   time.Now().UTC(),
	}
}
