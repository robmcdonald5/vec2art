# Environment Variables Setup Guide

This guide explains how to configure environment variables for local development, CI/CD, and Vercel deployment.

## Required Environment Variables

- `PUBLIC_FORMSPARK_ENDPOINT_ID` - Formspark form endpoint for contact form
- `PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key for bot protection

## Setup Instructions

### 1. Local Development

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `.env` and add your actual values:
```env
PUBLIC_FORMSPARK_ENDPOINT_ID=your_actual_formspark_id
PUBLIC_TURNSTILE_SITE_KEY=your_actual_turnstile_key
```

### 2. GitHub Actions CI/CD

The CI pipeline supports two modes:

#### Option A: Using GitHub Secrets (Recommended)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these repository secrets:
   - `PUBLIC_FORMSPARK_ENDPOINT_ID` - Your Formspark endpoint ID
   - `PUBLIC_TURNSTILE_SITE_KEY` - Your Turnstile site key

The CI will automatically detect and use these secrets.

#### Option B: Using Placeholder Values

If you don't add GitHub Secrets, the CI will automatically use placeholder values from `.env.ci` to allow builds to complete. The contact form won't be functional but the build will succeed.

### 3. Vercel Deployment

For Vercel deployment, you need to configure environment variables in the Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these environment variables:
   - `PUBLIC_FORMSPARK_ENDPOINT_ID` - Your Formspark endpoint ID
   - `PUBLIC_TURNSTILE_SITE_KEY` - Your Turnstile site key

Set these for all environments (Production, Preview, Development) or as needed.

#### Alternative: Using Vercel CLI

```bash
vercel env add PUBLIC_FORMSPARK_ENDPOINT_ID
vercel env add PUBLIC_TURNSTILE_SITE_KEY
```

## Getting API Keys

### Formspark
1. Sign up at https://formspark.io/
2. Create a new form
3. Copy the endpoint ID from your dashboard

### Cloudflare Turnstile
1. Go to https://dash.cloudflare.com/
2. Navigate to Turnstile
3. Create a new site
4. Copy the site key (not the secret key)

## Testing Without Keys

The application is designed to build successfully even without these keys configured. In CI/test environments:

- The `.env.ci` file provides placeholder values
- The contact form will render but won't be functional
- All other features will work normally

## Security Notes

- These are "PUBLIC_" prefixed variables, meaning they're exposed to the client
- They're safe to include in frontend code as they're meant to be public
- Never commit actual values to the repository - use `.env` files locally and secrets in CI/CD
- The `.env` file is gitignored to prevent accidental commits

## Troubleshooting

### Build Fails with "PUBLIC_TURNSTILE_SITE_KEY" is not exported

**Solution**: Ensure one of the following:
1. GitHub Secrets are configured (for CI)
2. `.env.ci` file exists in frontend/ directory (fallback for CI)
3. `.env` file exists with values (for local development)
4. Environment variables are set in Vercel dashboard (for deployment)

### Contact Form Not Working

**Check**:
1. Verify the Formspark endpoint ID is correct
2. Ensure Turnstile site key matches your domain configuration
3. Check browser console for any CORS or validation errors

## Best Practices

1. **Development**: Use real keys in local `.env` for full testing
2. **CI/CD**: Use GitHub Secrets for production builds, placeholders for PR builds
3. **Production**: Always use real keys configured in Vercel dashboard
4. **Security**: Rotate keys periodically and never share secret keys