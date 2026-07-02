FROM golang:1.23-alpine AS build
WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download || echo "go.sum not found, continuing..."

COPY . .

RUN go env -w GO111MODULE=on && \
    CGO_ENABLED=0 GOOS=linux go build -o /app/app ./src

FROM alpine:latest

WORKDIR /app
RUN mkdir -p uploads

COPY --from=build /app/app /app/app

EXPOSE 8080
ENTRYPOINT ["/app/app"]