@echo off
setlocal enabledelayedexpansion
echo ====================================
echo Packaging Archy Application
echo ====================================
echo.

set step=0
set total=4

set /a step+=1
set /a progress=(step*100)/total
if exist release rmdir /s /q release >nul 2>&1
mkdir release >nul 2>&1
echo [%progress%%%] Cleared release folder

set /a step+=1
set /a progress=(step*100)/total
if exist %USERPROFILE%\AppData\Local\electron-builder\Cache rmdir /s /q "%USERPROFILE%\AppData\Local\electron-builder\Cache" >nul 2>&1
echo [%progress%%%] Cleared electron-builder cache

set /a step+=1
set /a progress=(step*100)/total
echo [%progress%%%] Building application
start /b cmd /c "npm run build --silent > build.tmp 2>&1 & call echo %%errorlevel%% > build.code"

:build_wait
if not exist build.code (
    <nul set /p="."
    timeout /t 1 /nobreak >nul
    goto build_wait
)

set /p BUILD_RESULT=<build.code

if not "%BUILD_RESULT%"=="0" (
    echo.
    echo [ERROR] Build failed - see errors below:
    echo.
    type build.tmp
    del build.code >nul 2>&1
    del build.tmp >nul 2>&1
    echo.
    pause
    exit /b %BUILD_RESULT%
)
del build.code >nul 2>&1
del build.tmp >nul 2>&1
echo  [√] Done

set /a step+=1
set /a progress=(step*100)/total
echo [%progress%%%] Creating portable executable
start /b cmd /c "npx electron-builder --win portable --x64 > package.tmp 2>&1 & call echo %%errorlevel%% > package.code"

:package_wait
if not exist package.code (
    <nul set /p="."
    timeout /t 1 /nobreak >nul
    goto package_wait
)

set /p PACKAGE_RESULT=<package.code

if not "%PACKAGE_RESULT%"=="0" (
    echo.
    echo [ERROR] Packaging failed - see errors below:
    echo.
    type package.tmp
    del package.code >nul 2>&1
    del package.tmp >nul 2>&1
    echo.
    pause
    exit /b %PACKAGE_RESULT%
)
del package.code >nul 2>&1
del package.tmp >nul 2>&1
echo  [√] Done

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
