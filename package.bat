@echo off
setlocal enabledelayedexpansion
echo ====================================
echo Packaging Archy Application
echo ====================================
echo.

echo [1/4] Clearing release folder...
if exist release rmdir /s /q release >nul 2>&1
mkdir release >nul 2>&1
echo       Done.

echo [2/4] Clearing electron-builder cache...
if exist "%USERPROFILE%\AppData\Local\electron-builder\Cache" rmdir /s /q "%USERPROFILE%\AppData\Local\electron-builder\Cache" >nul 2>&1
echo       Done.

echo [3/4] Building application...
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    echo.
    pause
    exit /b 1
)
echo       Done.

echo [4/4] Creating portable executable...
call npx electron-builder --win portable --x64
if errorlevel 1 (
    echo.
    echo [ERROR] Packaging failed!
    echo.
    pause
    exit /b 1
)
echo       Done.

echo.
echo ====================================
echo [100%%] Package created successfully!
echo ====================================
echo.

:: Show output location
if exist "release\*.exe" (
    for %%f in (release\*.exe) do echo Output: %%f
) else (
    echo [WARNING] No executable found in release folder
    echo Check electron-builder configuration for output directory
)

echo.
pause
exit /b 0
