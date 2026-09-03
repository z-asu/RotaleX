# Build stage
FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o rotalex .

# Run stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /app/rotalex .
COPY --from=builder /app/uploads ./uploads

RUN mkdir -p uploads

EXPOSE 8080

CMD ["./rotalex"]
