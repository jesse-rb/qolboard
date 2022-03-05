export ENV="production"
export PORT="80"
export CERT_FILE_PATH="/ssl/qolboard.crt"
export KEY_FILE_PATH="/ssl/qolboard.key"
cd /app
nohup ./server > /dev/null 2> /dev/null < /dev/null &