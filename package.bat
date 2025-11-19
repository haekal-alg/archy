@echo off
echo ====================================
echo Packaging Archy Application
echo ====================================
echo.

echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    exit /b %errorlevel%
)

echo.
echo Creating distributable package...
call electron-builder
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
