# PowerShell script to update CORS settings on Railway
# You need to have Railway CLI installed and logged in
# This script only updates the API Gateway CORS settings and does not change any frontend configuration

# List of allowed origins (include your Vercel domain)
$CORS_ORIGINS = "https://candidate-v.vercel.app,http://localhost:3000,http://localhost:5173"

# Manual Instructions
Write-Host "To update your Railway API Gateway CORS settings:"
Write-Host "1. Go to Railway dashboard: https://railway.app/dashboard"
Write-Host "2. Open your API Gateway project (api-gw-production)"
Write-Host "3. Go to Variables section"
Write-Host "4. Add or update the CORS_ORIGINS variable:"
Write-Host "   - Name: CORS_ORIGINS"
Write-Host "   - Value: $CORS_ORIGINS"
Write-Host "5. Click Deploy to apply changes"
Write-Host ""

# If Railway CLI is installed, try to update automatically
Write-Host "Attempting to update with Railway CLI (if installed)..."
try {
    railway variables set CORS_ORIGINS="$CORS_ORIGINS"
    Write-Host "CORS settings updated successfully via Railway CLI. Restart your service for changes to take effect."
} catch {
    Write-Host "Railway CLI command failed. Please use the manual instructions above."
} 