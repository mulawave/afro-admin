@echo off
echo === Starting Admin Deploy ===
echo %date% %time%
cd /d %~dp0

echo.
echo === Deploying Admin to Cloud Run ===
call gcloud run deploy afrovision-admin --source . --region us-central1 --port 8080 --allow-unauthenticated --memory 1Gi --timeout 60 --set-env-vars "NODE_ENV=production,HOSTNAME=0.0.0.0,NEXT_PUBLIC_API_BASE_URL=https://afrovision-backend-zoeqld5lsa-uc.a.run.app,API_BASE_URL=https://afrovision-backend-zoeqld5lsa-uc.a.run.app,ODS_API_BASE_URL=https://ods-api-134538542038.us-central1.run.app" --quiet

echo.
echo === Deploy Exit Code: %ERRORLEVEL% ===
echo %date% %time%
echo === Done ===
