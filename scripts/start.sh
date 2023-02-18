cd /app
nohup ./server &> /dev/null &
echo $! > /app/.apppid
