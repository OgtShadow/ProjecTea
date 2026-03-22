FROM golang:1.23-alpine AS build
WORKDIR /app

COPY . .

RUN go env -w GO111MODULE=on && \
    go build -o /app/app ./src

FROM gcr.io/distroless/base-debian11
COPY --from=build /app/app /app/app
EXPOSE 8080
ENTRYPOINT ["/app/app"]
