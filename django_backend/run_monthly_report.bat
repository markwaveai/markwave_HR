@echo off
set "LOGFILE=C:\MarkwaveHR\keka_markwave\django_backend\report_execution.log"
echo [%date% %time%] Starting monthly report generation... >> %LOGFILE%

cd /d C:\MarkwaveHR\keka_markwave\django_backend
venv\Scripts\python.exe manage.py send_monthly_report >> %LOGFILE% 2>&1

echo [%date% %time%] Monthly report generation completed. >> %LOGFILE%
echo ---------------------------------------------------- >> %LOGFILE%
