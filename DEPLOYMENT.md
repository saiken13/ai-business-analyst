# Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Ready for production"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (see below)
   - Click "Deploy"

## Environment Variables

Add these in Vercel's Environment Variables settings:

### Database (Supabase)
```
DATABASE_URL=<your-supabase-pooler-connection-string>
DIRECT_URL=<your-supabase-direct-connection-string>
```
**Get these from:** Supabase Dashboard → Project Settings → Database

### GitHub OAuth
```
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
```
**Get these from:** [GitHub Developer Settings](https://github.com/settings/developers)

### NextAuth
```
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-actual-domain.vercel.app
```
**Generate secret:** Run `openssl rand -base64 32` in terminal

### AI Services
```
GROQ_API_KEY=<your-groq-api-key-from-console.groq.com>
```
**Get this from:** [Groq Console](https://console.groq.com)

## Post-Deployment Steps

1. **Update GitHub OAuth Callback**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Update callback URL to: `https://your-actual-domain.vercel.app/api/auth/callback/github`

2. **Test the deployment**:
   - Visit your deployed URL
   - Try logging in with GitHub
   - Upload a test dataset
   - Analyze the dataset

## Features

✅ CSV/TSV dataset upload
✅ AI-powered insights (Groq + OpenAI fallback)
✅ Data visualization with grouped charts
✅ Dataset deletion with confirmation
✅ Re-analysis capability
✅ GitHub OAuth authentication

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js with GitHub
- **AI**: Groq SDK (Llama 3.3 70B) + OpenAI fallback
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **ORM**: Prisma

## Important Notes

- The `analytics-service` directory is excluded from deployment (it's a separate Python service)
- All `.env*` files are excluded from git (sensitive data)
- Database uses PgBouncer connection pooling for performance
- AI insights use free Groq API by default, with OpenAI as fallback

## Troubleshooting

### Build fails
- Ensure no Python venv directories exist in the project
- Check that `.vercelignore` includes `analytics-service`

### Authentication fails
- Verify NEXTAUTH_URL matches your deployment URL
- Verify GitHub OAuth callback URL is correct

### Database connection issues
- Ensure DATABASE_URL and DIRECT_URL are set correctly
- Check Supabase database is accessible

## Support

For issues, check:
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
