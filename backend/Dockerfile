# backend/Dockerfile
# Multi-stage build for Go backend

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /app/server .

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Copy binary
COPY --from=builder /app/server .

# Copy config files
COPY config.example.yaml ./config.yaml

# Expose port
EXPOSE 8080

# Run
CMD ["./server"]
