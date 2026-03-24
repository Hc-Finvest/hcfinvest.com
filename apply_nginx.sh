#!/bin/bash
# Script to apply Nginx config with sudo -S
PASSWORD=$1

echo "[Script] Applying Nginx configuration..."
echo "$PASSWORD" | sudo -S cp /home/hcfinvest/hcfinvest_nginx.conf /etc/nginx/sites-available/hcfinvest
echo "$PASSWORD" | sudo -S nginx -t
if [ $? -eq 0 ]; then
    echo "[Script] Nginx config is valid. Reloading..."
    echo "$PASSWORD" | sudo -S systemctl reload nginx
    echo "[Script] Nginx reloaded successfully."
else
    echo "[Script] Nginx config error! Rollback might be needed."
    exit 1
fi
