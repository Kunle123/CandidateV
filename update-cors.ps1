# PowerShell script to update CORS settings on Railway
# You need to have Railway CLI installed and logged in

# List of allowed origins (add your Vercel domain here)
$CORS_ORIGINS = "https://candidate-6nohbuue6-kunle-ibiduns-projects.vercel.app,http://localhost:5173"

# Set the CORS_ORIGINS variable
Write-Host "Setting CORS_ORIGINS to: $CORS_ORIGINS"
railway variables set CORS_ORIGINS="$CORS_ORIGINS"

Write-Host "CORS settings updated successfully. Restart your service for changes to take effect."

# If you don't have Railway CLI installed, you can update these settings manually:
Write-Host "`nManual Instructions:"
Write-Host "1. Go to Railway dashboard: https://railway.app/dashboard"
Write-Host "2. Open your API Gateway project"
Write-Host "3. Go to Variables section"
Write-Host "4. Add a new variable:"
Write-Host "   - Name: CORS_ORIGINS"
Write-Host "   - Value: $CORS_ORIGINS"
Write-Host "5. Click Deploy to apply changes." 