export PATH=$PATH:/usr/local/go/bin
export PORT="80"
cd /app
go mod init qolboard
go mod tidy
go build -o /app/server /app/main.go