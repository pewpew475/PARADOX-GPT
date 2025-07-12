# ParadoxGPT Vercel Deployment Guide

## Files Created for Vercel Deployment

1. **vercel.json** - Main Vercel configuration file
2. **api/index.py** - Vercel-compatible Flask entry point
3. **.vercelignore** - Files to exclude from deployment
4. **VERCEL_DEPLOYMENT.md** - This deployment guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional but recommended): Install with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Environment Variables Setup

Before deploying, you need to set up your environment variables in Vercel:

### Method 1: Via Vercel Dashboard (Recommended)
1. Go to your Vercel dashboard
2. Import your project or go to your project settings
3. Navigate to "Environment Variables"
4. Look for "Bulk Edit" or paste area
5. Copy and paste the following format with your actual API keys:

```env
DIVIDER_API_KEY=your_divider_api_key_here
THINKER_1_API_KEY=your_thinker_1_api_key_here
THINKER_2_API_KEY=your_thinker_2_api_key_here
THINKER_3_API_KEY=your_thinker_3_api_key_here
THINKER_4_API_KEY=your_thinker_4_api_key_here
THINKER_5_API_KEY=your_thinker_5_api_key_here
THINKER_6_API_KEY=your_thinker_6_api_key_here
THINKER_7_API_KEY=your_thinker_7_api_key_here
THINKER_8_API_KEY=your_thinker_8_api_key_here
THINKER_9_API_KEY=your_thinker_9_api_key_here
THINKER_10_API_KEY=your_thinker_10_api_key_here
MID_COMBINER_1_API_KEY=your_mid_combiner_1_api_key_here
MID_COMBINER_2_API_KEY=your_mid_combiner_2_api_key_here
FINAL_COMBINER_API_KEY=your_final_combiner_api_key_here
```

### Method 2: Via Vercel CLI
```bash
vercel env add DIVIDER_API_KEY
vercel env add THINKER_1_API_KEY
vercel env add THINKER_2_API_KEY
# ... continue for all 14 keys
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will automatically detect the configuration
4. Set up environment variables (see above)
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to your project directory
3. Run: `vercel`
4. Follow the prompts to link your project
5. Set up environment variables
6. Deploy with: `vercel --prod`

## Important Notes

### File Structure Changes
- The main Flask app is now accessible via `api/index.py` for Vercel compatibility
- Static files are served from the `/static` route
- Templates are loaded from the `/templates` directory

### Environment Variables Required
Make sure to set all your ParadoxGPT API keys in Vercel:
```
DIVIDER_API_KEY=your_divider_api_key
THINKER_1_API_KEY=your_thinker_1_api_key
THINKER_2_API_KEY=your_thinker_2_api_key
... (continue for THINKER_3 through THINKER_10)
MID_COMBINER_1_API_KEY=your_mid_combiner_1_api_key
MID_COMBINER_2_API_KEY=your_mid_combiner_2_api_key
FINAL_COMBINER_API_KEY=your_final_combiner_api_key
```

**Total: 14 API Keys Required**
- 1 Divider API Key
- 10 Thinker API Keys (THINKER_1 through THINKER_10)
- 2 Mid-Level Combiner API Keys
- 1 Final Combiner API Key

### Limitations
- Vercel functions have a 30-second timeout (configured in vercel.json)
- Cold starts may cause initial requests to be slower
- File system is read-only (logs will go to stdout only)

## Troubleshooting

### Common Issues
1. **Import Errors**: Make sure all Python dependencies are in `requirements.txt`
2. **Environment Variables**: Ensure all API keys are set in Vercel dashboard
3. **Timeout Issues**: Long-running tasks may hit the 30-second limit

### Checking Logs
- View function logs in the Vercel dashboard under "Functions" tab
- Use `vercel logs` command if using CLI

## Testing Your Deployment

After deployment, test your application:
1. Visit your Vercel URL
2. Try sending a message through the chat interface
3. Check the Vercel function logs for any errors

## Custom Domain (Optional)

To use a custom domain:
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all environment variables are set
3. Ensure your Git repository is up to date
4. Check that all dependencies are in requirements.txt
