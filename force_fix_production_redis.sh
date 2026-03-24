#!/bin/bash
# HCFinvest Production Redis FORCE Repair

# 1. Clear any stuck dpkg locks
echo 'pune@N!lesh$2025' | sudo -S fuser -vki /var/lib/dpkg/lock-frontend
echo 'pune@N!lesh$2025' | sudo -S rm -rf /var/lib/dpkg/lock-frontend
echo 'pune@N!lesh$2025' | sudo -S dpkg --configure -a

# 2. Update and Force Install
echo 'pune@N!lesh$2025' | sudo -S apt-get update
echo 'pune@N!lesh$2025' | sudo -S apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" redis-server

# 3. Start and Enable
echo 'pune@N!lesh$2025' | sudo -S systemctl start redis-server
echo 'pune@N!lesh$2025' | sudo -S systemctl enable redis-server

# 4. Final Verification
echo 'pune@N!lesh$2025' | sudo -S redis-cli ping
