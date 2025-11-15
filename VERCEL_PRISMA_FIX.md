# Prisma on Vercel - Configuration Fix

## Problem
Prisma Client wasn't being generated during Vercel's build process, causing `PrismaClientInitializationError`.

## Solution Applied

### 1. Added `postinstall` Script
Added to `package.json`:
```json
"postinstall": "prisma generate"
```
This runs automatically after `npm install` on Vercel.

### 2. Updated Build Script
```json
"build": "prisma generate && tsc"
```
Ensures Prisma generates before TypeScript compilation.

### 3. Created Vercel Configuration
- `vercel.json` - Configures serverless function routing
- `api/index.ts` - Serverless function wrapper for Express app

### 4. Updated Server Entry Point
Modified `src/index.ts` to skip `app.listen()` when running on Vercel.

## Files Created/Modified

1. ✅ `server/package.json` - Added postinstall and build scripts
2. ✅ `server/vercel.json` - Vercel serverless function configuration
3. ✅ `server/api/index.ts` - Serverless function wrapper
4. ✅ `server/src/index.ts` - Skip listen on Vercel
5. ✅ `server/tsconfig.json` - Include api folder
6. ✅ Added `@vercel/node` dependency

## Next Steps

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Fix Prisma generation for Vercel"
   git push
   ```

2. **Redeploy on Vercel:**
   ```bash
   vercel deploy --prod
   ```
   
   Or it will auto-deploy on push if connected to Git.

3. **Verify Prisma Client Generation:**
   - Check Vercel build logs for "prisma generate" output
   - Test API endpoint: `https://your-app.vercel.app/api`

## How It Works

1. **During `npm install`:**
   - Vercel runs `npm install`
   - `postinstall` script automatically runs `prisma generate`
   - Prisma Client is generated in `node_modules/.prisma/client`

2. **During Build (if configured):**
   - `npm run build` runs `prisma generate && tsc`
   - Ensures Prisma Client is up-to-date before compilation

3. **Runtime:**
   - Serverless function at `api/index.ts` handles requests
   - Express app processes routes
   - Prisma Client is available and working

## Troubleshooting

If you still see Prisma errors:

1. **Check Vercel Build Logs:**
   - Look for "prisma generate" in the output
   - Verify it completes successfully

2. **Clear Vercel Cache:**
   - Go to Vercel Dashboard → Project Settings → General
   - Clear build cache and redeploy

3. **Verify Environment Variables:**
   - Ensure `DATABASE_URL` is set in Vercel
   - Check all required env vars are configured

4. **Manual Verification:**
   ```bash
   # Test locally
   npm install
   npm run build
   # Should see Prisma Client generation
   ```

## Additional Notes

- The `postinstall` script ensures Prisma generates even if build command isn't used
- Vercel caches `node_modules`, so Prisma must generate during install
- The build script provides an additional safety net
- Both approaches work together to ensure Prisma Client is always available

