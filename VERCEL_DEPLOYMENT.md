# Vercel Deployment Guide

This guide will help you deploy ZoloPilot.ai securely to Vercel with all the implemented security features.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **API Keys**: Obtain API keys for the LLMs you want to use
4. **Firebase Project**: Set up Firebase for authentication and data storage

## Step 1: Prepare Environment Variables

Create the following environment variables in your Vercel project:

### Required Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# LLM API Keys (add only the ones you plan to use)
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Optional Environment Variables

```bash
# Analytics (if using)
VITE_GA_MEASUREMENT_ID=your_google_analytics_id

# Custom Configuration
VITE_APP_NAME=ZoloPilot.ai
VITE_APP_VERSION=1.0.0
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts to configure your project
```

## Step 3: Configure Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add all the environment variables listed above
4. Make sure to set the correct environment (Production, Preview, Development)

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Enable SSL (automatic with Vercel)

## Step 5: Security Configuration

### Vercel Security Headers

Create or update `vercel.json` in your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Content Security Policy

The CSP headers are already configured in `index.html`. For additional security, you can also add them to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://*.firebaseio.com https://*.googleapis.com; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

## Step 6: Post-Deployment Verification

### 1. Test Core Functionality
- [ ] Application loads correctly
- [ ] User authentication works
- [ ] Mind map generation functions
- [ ] Export features work
- [ ] Firebase integration is working

### 2. Security Verification
- [ ] Check security headers using [securityheaders.com](https://securityheaders.com)
- [ ] Verify CSP is working (check browser console for violations)
- [ ] Test that API keys are not exposed in client-side code
- [ ] Confirm HTTPS is enforced

### 3. Performance Testing
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Test loading speed
- [ ] Verify mobile responsiveness

## Step 7: Monitoring and Maintenance

### Set Up Monitoring
1. Enable Vercel Analytics in your project dashboard
2. Set up error tracking (Sentry, LogRocket, etc.)
3. Monitor API usage and costs

### Regular Maintenance
1. **Weekly**: Check for dependency updates
2. **Monthly**: Review security audit results
3. **Quarterly**: Update API keys and review access logs

## Troubleshooting

### Common Issues

**Build Failures**
- Check that all dependencies are listed in `package.json`
- Verify environment variables are set correctly
- Review build logs in Vercel dashboard

**Runtime Errors**
- Check browser console for errors
- Verify API keys are working
- Check Firebase configuration

**Security Issues**
- Review CSP violations in browser console
- Check security headers with online tools
- Verify HTTPS is working correctly

### Getting Help

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Project Issues**: Check the project's GitHub repository

## Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** for all sensitive configuration
3. **Regularly update dependencies** to patch security vulnerabilities
4. **Monitor your application** for unusual activity
5. **Use HTTPS everywhere** - Vercel provides this automatically
6. **Implement proper error handling** to avoid information leakage
7. **Regular security audits** using `npm audit`

## Performance Optimization

1. **Enable Vercel's Edge Network** for global CDN
2. **Use Vercel's Image Optimization** for any images
3. **Implement proper caching strategies**
4. **Monitor bundle size** and optimize as needed
5. **Use Vercel Analytics** to track performance metrics

Your ZoloPilot.ai application is now ready for secure deployment on Vercel! 🚀