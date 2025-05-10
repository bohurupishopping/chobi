@echo off
echo ========================================
echo   Starting Chobi Image Generator Server
echo ========================================
echo.
echo Server will be available at: http://localhost:4000
echo.
echo Press Ctrl+C to stop the server
echo.

:: Set the port to 4000
set PORT=4000

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo ERROR: Node.js is not installed or not in PATH
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

:: Check if yarn is installed, otherwise use npm
where yarn >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo Using yarn to start development server...
  yarn dev --port %PORT%
) else (
  echo Using npm to start development server...
  npm run dev -- --port %PORT%
)

:: This will only execute if the server exits
echo.
echo Server has stopped
pause 