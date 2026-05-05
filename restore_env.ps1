Clear-Content .env
Add-Content .env -Value " SUPABASE_URL=REPLACE_WITH_YOUR_URL"
Add-Content .env -Value "SUPABASE_ANON_KEY=REPLACE_WITH_YOUR_ANON_KEY"
Add-Content .env -Value "SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY"
Add-Content .env -Value "DATABASE_URL=REPLACE_WITH_YOUR_DATABASE_URL"
Add-Content .env -Value \ENVIRONMENT=production\
Add-Content .env -Value \AUTO_APPROVE=true\
Add-Content .env -Value \SMTP_TLS=True\
Add-Content .env -Value \SMTP_PORT=587\
Add-Content .env -Value \SMTP_SERVER=smtp.hostinger.com\
Add-Content .env -Value \SMTP_USERNAME=info@geekorium.shop\
Add-Content .env -Value \SMTP_PASSWORD=SET_ME_VIA_ENV_VAR\
Add-Content .env -Value \EMAILS_FROM_EMAIL=info@geekorium.shop\
Add-Content .env -Value \EMAILS_FROM_NAME=Geekorium Shop\
