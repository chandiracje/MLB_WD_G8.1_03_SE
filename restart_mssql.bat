@echo off
setlocal
echo ==========================================================
echo LankaFresh Supermarket - Microsoft SQL Server Restart Tool
echo ==========================================================
echo Checking for Administrator privileges...

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator elevation (please click 'Yes' on the UAC prompt)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd.exe -ArgumentList '/c `\"%~f0`\"' -Verb RunAs"
    exit /b
)

echo.
echo [1/3] Restarting SQL Server (SQLEXPRESS) service...
net stop "MSSQL$SQLEXPRESS"
net start "MSSQL$SQLEXPRESS"

echo.
echo [2/3] Configuring and starting SQL Server Browser service...
sc config "SQLBrowser" start= auto
net start "SQLBrowser"

echo.
echo [3/3] Verifying TCP port 1433 connectivity...
powershell -NoProfile -Command "Test-NetConnection -ComputerName localhost -Port 1433"

echo.
echo ==========================================================
echo SQL Server restarted successfully and listening on port 1433!
echo You can now close this window and proceed.
echo ==========================================================
timeout /t 5
