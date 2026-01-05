# Geekorium TCG Backend - Deployment Guide

## Prerequisites
- Python 3.11+
- PostgreSQL database (Supabase)
- Environment variables configured

## Environment Variables Required
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for admin operations)
```

## Deployment Options

### Option 1: Railway (Recommended)
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables in Railway dashboard
5. Deploy: `railway up`

### Option 2: Render
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Option 3: Fly.io
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Set secrets: `fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=...`
5. Deploy: `fly deploy`

## Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn src.api.main:app --reload --port 8000
```

## Production Considerations
- Use gunicorn with uvicorn workers for production
- Enable CORS for your frontend domain
- Set up monitoring and logging
- Configure rate limiting
- Use environment-specific configs
