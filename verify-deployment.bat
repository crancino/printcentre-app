@echo off
echo ========================================
echo PrintCentre App - Deployment Check
echo ========================================
echo.

if not exist manifest.yml (
    echo ERROR: manifest.yml not found
    exit /b 1
)

echo [OK] Found manifest.yml
echo.

echo Checking files...
if exist src\portal-panel\index.js (echo [OK] portal-panel\index.js) else (echo [MISSING] portal-panel\index.js)
if exist src\agent-panel\index.js (echo [OK] agent-panel\index.js) else (echo [MISSING] agent-panel\index.js)
if exist src\resolver.js (echo [OK] resolver.js) else (echo [MISSING] resolver.js)
echo.

echo ========================================
echo Deployment Status
echo ========================================
echo App deployed at version 3.0.0
echo.

echo ========================================
echo Environment Variables
echo ========================================
echo Check if SAS_URL is set:
echo   forge variables list
echo.
echo If not set, run:
echo   forge variables set SAS_URL
echo.

echo ========================================
echo Next Steps
echo ========================================
echo 1. Set SAS_URL environment variable
echo 2. Run: forge install --upgrade
echo 3. Read: QUICK_TEST_GUIDE.md
echo 4. Test in Jira Service Management portal
echo.

echo ========================================
echo Documentation
echo ========================================
echo   QUICK_TEST_GUIDE.md         - Testing guide
echo   PORTAL_PANEL_FIX_SUMMARY.md - Fix details
echo.

pause
