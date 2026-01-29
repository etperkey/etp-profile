@echo off
echo.
echo ================================================
echo   WORMS PARODY - Animation Server
echo ================================================
echo.
echo Starting local server...
echo.
echo Open your browser to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0\.."
python -m http.server 8000
pause
