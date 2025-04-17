#!/bin/bash

# This script is for updating CORS settings on Railway
# Run it with: railway run ./update-cors.sh

# List of allowed origins (add your Vercel domain here)
CORS_ORIGINS="https://candidate-6nohbuue6-kunle-ibiduns-projects.vercel.app,http://localhost:5173"

# Set the CORS_ORIGINS variable
echo "Setting CORS_ORIGINS to: $CORS_ORIGINS"
railway variables set CORS_ORIGINS="$CORS_ORIGINS"

echo "CORS settings updated successfully. Restart your service for changes to take effect." 