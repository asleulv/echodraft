# Frontend Deployment Guide

This document provides instructions for deploying the TextVault frontend application in both development and production environments.

## Environment Configuration

The application uses environment-specific configuration files:

- `.env.development`: Environment variables for development
- `.env.production`: Environment variables for production

## Development Setup

1. **Environment Variables**:
   - Use the `.env.development` file for development environment variables
   - This file should already be configured with sensible defaults

2. **Running the Development Server**:
   ```bash
   # Install dependencies
   npm install
   
   # Start the development server
   npm run dev
   ```

3. **Development Configuration**:
   - By default, the development server runs on `http://localhost:3000`
   - API requests are proxied to `http://localhost:8000` (configurable in `.env.development`)
   - Analytics are disabled in development mode

## Production Deployment

1. **Environment Variables**:
   - Copy `.env.production` to your production environment
   - Update all placeholder values with actual production values
   - Ensure all required variables are set

2. **Building for Production**:
   ```bash
   # Install dependencies
   npm install
   
   # Build the production bundle
   npm run build
   
   # Start the production server
   npm start
   ```

3. **Deployment Options**:

   **Option 1: Vercel (Recommended)**
   - Connect your GitHub repository to Vercel
   - Configure environment variables in the Vercel dashboard
   - Vercel will automatically build and deploy your application

   **Option 2: Static Export**
   ```bash
   # Create a static export
   npm run export
   
   # Deploy the 'out' directory to any static hosting service
   ```

   **Option 3: Self-hosted Node.js Server**
   - Build the application as described above
   - Use PM2 or similar to manage the Node.js process
   - Set up Nginx as a reverse proxy

4. **Production Configuration**:
   - Set `NEXT_PUBLIC_API_URL` to your production API URL
   - Enable analytics in production
   - Configure any other production-specific settings

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | `https://api.example.com` |
| NEXT_PUBLIC_AUTH_ENABLED | Enable authentication | `true` |
| NEXT_PUBLIC_ENABLE_ANALYTICS | Enable analytics | `true` |
| NEXT_PUBLIC_ENABLE_STRIPE | Enable Stripe payments | `true` |
| NEXT_PUBLIC_ENVIRONMENT | Environment name | `production` |
| NEXT_PUBLIC_GA_MEASUREMENT_ID | Google Analytics ID | `G-XXXXXXXXXX` |

## Security Considerations

1. **Environment Variables**:
   - Only variables prefixed with `NEXT_PUBLIC_` will be included in the client-side bundle
   - Sensitive information should not use the `NEXT_PUBLIC_` prefix
   - For sensitive operations, use API routes that run server-side

2. **API Communication**:
   - Ensure CORS is properly configured on the backend
   - Use HTTPS for all API communication in production
   - Implement proper authentication and authorization

3. **Content Security Policy**:
   - Consider implementing a Content Security Policy
   - Restrict loading of external resources to trusted domains

## Continuous Integration/Deployment

For a CI/CD pipeline:

1. **GitHub Actions Example**:
   ```yaml
   name: Deploy Frontend
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Build
           run: npm run build
           
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             vercel-args: '--prod'
   ```

2. **Environment-specific Deployments**:
   - Use different deployment targets for staging and production
   - Configure environment-specific variables for each target

## Switching Between Environments

During development, you can specify which environment file to use:

```bash
# For development (default)
npm run dev

# For production build using production env
npm run build
```

If you need to manually set environment variables:

### Unix/Linux/macOS:

```bash
# Set environment variables
export NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Windows (Command Prompt):

```cmd
# Set environment variables
set NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Windows (PowerShell):

```powershell
# Set environment variables
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
```

Next.js will automatically load the appropriate environment variables based on the command or from the environment.
