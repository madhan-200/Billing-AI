# BillerAGI - Deployment Guide

This guide provides step-by-step instructions for deploying the BillerAGI platform to production.

## Prerequisites

- GitHub account
- Render account (for backend)
- Netlify or Vercel account (for frontend)
- Neon PostgreSQL database
- Gemini API key
- Cloudinary account
- Gmail account with app password

## Database Setup (Neon PostgreSQL)

### 1. Create Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create new project
3. Note your connection string
4. Connect to database:
   ```bash
   psql "your-neon-connection-string"
   ```

### 2. Run Schema

```bash
\i backend/database/schema.sql
```

### 3. Create Admin User

After deployment, use the API to create an admin user:

```bash
curl -X POST https://your-backend-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourcompany.com",
    "password": "your-secure-password",
    "full_name": "Admin User"
  }'
```

## Backend Deployment (Render)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `billeragi-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Instance Type**: Free or Starter

### 3. Add Environment Variables

In Render dashboard, add all environment variables from `.env.example`:

```
PORT=5000
NODE_ENV=production
DATABASE_URL=<your-neon-connection-string>
GEMINI_API_KEY=<your-gemini-key>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-app-password>
EMAIL_FROM=Billing System <your-email>
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=7d
COMPANY_NAME=Your Company Name
COMPANY_ADDRESS=123 Business Street, City, State 12345
COMPANY_EMAIL=billing@yourcompany.com
COMPANY_PHONE=+1-234-567-8900
COMPANY_TAX_ID=12-3456789
BILLING_CRON_SCHEDULE=0 9 * * *
REMINDER_CRON_SCHEDULE=0 10 * * *
FRONTEND_URL=<your-frontend-url>
```

### 4. Deploy

Click "Create Web Service" - Render will automatically deploy.

Your backend will be available at: `https://billeragi-backend.onrender.com`

## Frontend Deployment (Netlify)

### 1. Update Frontend Environment

Create `frontend/.env.production`:

```env
VITE_API_URL=https://billeragi-backend.onrender.com/api
```

### 2. Deploy to Netlify

#### Option A: Netlify CLI

```bash
cd frontend
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

#### Option B: Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

5. Add environment variable:
   - `VITE_API_URL`: `https://billeragi-backend.onrender.com/api`

6. Click "Deploy site"

Your frontend will be available at: `https://your-site-name.netlify.app`

## Alternative: Frontend on Vercel

### Deploy to Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Or use Vercel dashboard:
1. Import GitHub repository
2. Framework preset: Vite
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variable: `VITE_API_URL`

## Post-Deployment Configuration

### 1. Update Backend CORS

Update `FRONTEND_URL` in Render environment variables to your actual frontend URL.

### 2. Test the Application

1. Visit your frontend URL
2. Register admin user via API
3. Login to dashboard
4. Verify all features work

### 3. Set Up Gmail App Password

1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App passwords → Generate new
4. Use this password in `EMAIL_PASSWORD` environment variable

### 4. Configure Cloudinary

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Note your Cloud Name, API Key, and API Secret
3. Add to environment variables

## Monitoring & Maintenance

### Health Checks

- Backend: `https://your-backend.onrender.com/health`
- API Docs: `https://your-backend.onrender.com/`

### Logs

**Render:**
- View logs in Render dashboard
- Logs → Real-time logs

**Application Logs:**
- Winston logs are stored in `logs/` directory
- Access via Render shell or download

### Database Backups

Neon provides automatic backups. To manually backup:

```bash
pg_dump "your-neon-connection-string" > backup.sql
```

### Scaling

**Render:**
- Upgrade instance type for more resources
- Enable auto-scaling in settings

**Database:**
- Neon scales automatically
- Monitor usage in Neon console

## Troubleshooting

### Backend Won't Start

1. Check Render logs
2. Verify all environment variables are set
3. Test database connection
4. Check Node.js version (should be 18+)

### Frontend Can't Connect to Backend

1. Verify `VITE_API_URL` is correct
2. Check CORS settings in backend
3. Ensure backend is running
4. Check browser console for errors

### Email Not Sending

1. Verify Gmail app password
2. Check SMTP settings
3. Review email logs in backend
4. Test with test email endpoint

### Database Connection Issues

1. Verify Neon connection string
2. Check SSL mode is enabled
3. Ensure database is not suspended
4. Review Neon console for issues

## Security Checklist

- [ ] All environment variables are set
- [ ] JWT secret is strong and random
- [ ] Database credentials are secure
- [ ] API keys are not exposed in frontend
- [ ] CORS is properly configured
- [ ] HTTPS is enabled (automatic on Render/Netlify)
- [ ] Admin passwords are strong
- [ ] Email credentials are secure

## Cost Optimization

### Free Tier Limits

**Render Free:**
- Spins down after 15 minutes of inactivity
- 750 hours/month

**Netlify Free:**
- 100 GB bandwidth/month
- 300 build minutes/month

**Neon Free:**
- 0.5 GB storage
- 1 compute hour/month

### Recommendations

- Start with free tiers for testing
- Upgrade to paid plans for production
- Monitor usage in each platform's dashboard

## Backup Strategy

1. **Database**: Daily automated backups via Neon
2. **Code**: Version controlled in GitHub
3. **Environment Variables**: Document in secure location
4. **Logs**: Download weekly from Render

## Support

For deployment issues:
- Render: https://render.com/docs
- Netlify: https://docs.netlify.com
- Neon: https://neon.tech/docs
- Vercel: https://vercel.com/docs

---

**Deployment Complete! 🎉**

Access your application:
- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-backend.onrender.com`
- API Docs: `https://your-backend.onrender.com/`
