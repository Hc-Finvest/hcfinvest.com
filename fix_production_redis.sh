#!/bin/bash
# HCFinvest Production Redis Repair

# 1. Update and Install
echo 'pune@N!lesh$2025' | sudo -S apt-get update
echo 'pune@N!lesh$2025' | sudo -S apt-get install -y redis-server

# 2. Start and Enable
echo 'pune@N!lesh$2025' | sudo -S systemctl start redis-server
echo 'pune@N!lesh$2025' | sudo -S systemctl enable redis-server

# 3. Final Verification
echo 'pune@N!lesh$2025' | sudo -S redis-cli ping
