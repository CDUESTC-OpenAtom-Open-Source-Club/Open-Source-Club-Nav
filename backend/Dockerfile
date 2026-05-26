FROM golang:1.26-alpine AS builder
WORKDIR /src
RUN apk add --no-cache ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/openatom-backend .

FROM alpine:3.21 AS runner
WORKDIR /app
RUN apk add --no-cache ca-certificates && adduser -D -H -s /sbin/nologin app
COPY --from=builder /out/openatom-backend /app/openatom-backend
COPY config.example.yaml /app/config.example.yaml
USER app
ENV GIN_MODE=release
ENV CONFIG_PATH=/app/config.yaml
EXPOSE 8080
CMD ["/app/openatom-backend"]
