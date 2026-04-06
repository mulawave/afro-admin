@echo off
echo === Starting Admin Deploy ===
echo %date% %time%
cd /d c:\Users\HomePC\Documents\AfroVision_web\Afrovision\admin

echo.
echo === Deploying Admin to Cloud Run ===
call gcloud run deploy afrovision-admin --source . --region us-central1 --port 8080 --allow-unauthenticated --memory 1Gi --timeout 60 --set-env-vars "NODE_ENV=production" --quiet

echo.
echo === Deploy Exit Code: %ERRORLEVEL% ===
echo %date% %time%
echo === Done ===
