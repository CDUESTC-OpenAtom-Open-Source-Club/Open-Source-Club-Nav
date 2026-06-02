FROM golang:1.26-alpine AS builder
WORKDIR /src
RUN apk add --no-cache ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/openatom-backend .

FROM alpine:3.21 AS runner
WORKDIR /app
RUN apk add --no-cache ca-certificates curl tzdata \
    && adduser -D -H -s /sbin/nologin app \
    && mkdir -p /app/data \
    && chown -R app:app /app
COPY --from=builder /out/openatom-backend /app/openatom-backend
COPY config.example.yaml /app/config.example.yaml
USER app
ENV GIN_MODE=release
ENV CONFIG_PATH=/app/config.yaml
ENV DB_PATH=/app/data/app.db
# Go 运行时内存软上限 64MiB（SQLite 嵌入式 page cache 占额外内存），
# 配合 96M 容器 limit，触发更积极 GC
ENV GOMEMLIMIT=64MiB
ENV GOGC=50
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/healthz || exit 1
CMD ["/app/openatom-backend"]
