export PATH=$PATH:/usr/local/go/bin
cd /app
go mod init qolboard
go mod tidy
go build -o /app/server /app/main.go