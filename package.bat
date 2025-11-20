@echo off
echo ====================================
echo Packaging Archy Application
echo ====================================
echo.

echo Cleaning release folder...
if exist release rmdir /s /q release
mkdir release

echo.
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    exit /b %errorlevel%
)

echo.
echo Creating portable single executable...
call npx electron-builder --win portable --x64
if %errorlevel% neq 0 (
    echo Error: Packaging failed
    exit /b %errorlevel%
)

echo.
echo ====================================
echo Package created successfully!
echo ====================================
echo.

exit /b 0
