#!/bin/bash
# HCFinvest 'Elite' Deployment Script

# 1. Recover ownership from root
echo 'pune@N!lesh$2025' | sudo -S chown -R hcfinvest:hcfinvest /home/hcfinvest/hcfinvest

# 2. Cleanup old build
cd /home/hcfinvest/hcfinvest/frontend
rm -rf dist

# 3. Build optimized frontend
npm run build

# 4. Finish Backend setup
cd ../backend
# Ensure PM2 is aware of the new server state
pm2 restart all
