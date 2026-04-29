FROM golang:1.23-alpine AS build
WORKDIR /app

COPY go.mod go.sum* ./
RUN go mod download || echo "go.sum not found, continuing..."

COPY . .

RUN go env -w GO111MODULE=on && \
    go build -o /app/app ./src

FROM gcr.io/distroless/base-debian11
COPY --from=build /app/app /app/app
EXPOSE 8080
ENTRYPOINT ["/app/app"]
