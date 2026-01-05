# Quick Deploy Fix

The Edge Function has been updated with proper CORS preflight handling.

## To redeploy:

### Option 1: Via Supabase Dashboard (Easiest)
1. Go to Supabase Dashboard → Edge Functions → create-driver
2. Click "Edit" 
3. Replace the entire code with the updated version from `supabase/functions/create-driver/index.ts`
4. Look for this section at the top (around line 23):
```typescript
export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
```
5. Click Deploy

### Option 2: Via CLI
```bash
cd "c:\Users\LOQ Lenovo\OneDrive\Documents\School\Soft eng\web_app"
npx supabase functions deploy create-driver
```

Then try creating a driver again!
