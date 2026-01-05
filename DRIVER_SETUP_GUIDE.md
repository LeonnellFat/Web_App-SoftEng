# Driver Account System Setup Guide

## Overview
This guide explains how to deploy the new driver account creation system that uses Supabase Auth Admin API to create driver accounts, profiles, and driver metadata.

## What Changed

### 1. **Database Schema** (Optional - if you want to remove address field)
Run this migration in Supabase SQL Editor:
```sql
-- From: db/migrations/002_update_drivers_table.sql
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

ALTER TABLE public.drivers
  DROP COLUMN IF EXISTS address;

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_drivers_username ON public.drivers(username);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON public.drivers(profile_id);
```

### 2. **New Files Created**
- `supabase/functions/create-driver/index.ts` - Edge Function for admin driver creation
- `supabase/functions/_shared/cors.ts` - CORS utilities
- `src/services/driverService.ts` - Frontend driver service
- `src/components/admin/AdminDrivers.tsx` - Updated component

### 3. **Key Features**
✅ Create driver accounts using Supabase Auth Admin API
✅ Auto-create profiles with role='driver'
✅ Store driver metadata (username, vehicle, license)
✅ No passwords stored in driver table
✅ Toggle driver status (active/inactive)
✅ Toggle driver availability
✅ Delete drivers (cascades)
✅ Realtime fetching with Supabase

## Setup Steps

### Step 1: Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Copy the SQL from `db/migrations/002_update_drivers_table.sql`
3. Execute it

### Step 2: Deploy Edge Function
The Edge Function handles the admin operations for creating driver accounts.

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy create-driver
```

**Option B: Manual Deployment**
1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `create-driver`
4. Copy code from `supabase/functions/create-driver/index.ts`
5. Click "Deploy"

### Step 3: Update Environment Variables
Make sure your `.env.local` has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Verify Installation
1. Run your dev server: `npm run dev`
2. Go to Admin Dashboard → Drivers
3. Click "Add Driver"
4. Fill in all required fields:
   - Full Name
   - Email (must be unique)
   - Username (unique, alphanumeric + underscore/dash)
   - Phone
   - Password (min 6 chars)
   - Vehicle Number
   - License Number (optional)

5. Click "Create Driver Account"

## Data Flow

```
AdminDrivers Component
    ↓
    calls createDriver() from driverService
    ↓
    POST to Edge Function: /functions/v1/create-driver
    ↓
    Edge Function with Service Role Key:
      1. Creates auth.users entry
      2. Inserts into profiles with role='driver'
      3. Inserts into drivers table
    ↓
    Returns driver ID and metadata
    ↓
    Frontend fetches updated driver list
    ↓
    UI displays new driver
```

## API Endpoints

### POST /functions/v1/create-driver
Creates a new driver account.

**Request Body:**
```json
{
  "email": "driver@example.com",
  "password": "securepassword123",
  "fullName": "Juan Dela Cruz",
  "phone": "09123456789",
  "username": "juan_driver",
  "vehicleNumber": "ABC-1234",
  "licenseNumber": "DL123456789"  // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Driver account created successfully",
  "data": {
    "userId": "uuid-string",
    "profileId": "uuid-string",
    "driverId": "uuid-string",
    "email": "driver@example.com",
    "username": "juan_driver",
    "fullName": "Juan Dela Cruz"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Error message describing what went wrong"
}
```

## Component Features

### AdminDrivers Component

**Form Validation:**
- All required fields must be filled
- Email must be valid format
- Password minimum 6 characters
- Username: alphanumeric, underscore, dash only

**Driver Actions:**
- ✅ **Toggle Status**: Active ↔ Inactive
- ✅ **Toggle Availability**: Available ↔ Unavailable
- ✅ **Delete**: Removes driver (cascade deletes profile and auth user)
- ✅ **View Details**: Name, email, username, phone, vehicle, license, rating, deliveries

**UI Elements:**
- Stats Cards: Active Drivers, Total Deliveries, Average Rating
- Form with full validation
- Error messages with toast notifications
- Success notifications
- Empty state message

## Troubleshooting

### Error: "Failed to create driver account"
1. Check browser console for detailed error
2. Verify all fields are filled correctly
3. Ensure username is unique (no special characters)
4. Verify email is not already registered

### Error: "Edge Function not found"
1. Verify Edge Function is deployed: `supabase functions deploy create-driver`
2. Check Supabase dashboard → Edge Functions
3. Verify function name is exactly `create-driver`

### Driver created but not visible in list
1. Refresh the page
2. Check browser console for fetch errors
3. Verify RLS policies allow admin to read drivers table

### Error: "Service role key not found"
1. Edge Function needs SERVICE_ROLE_KEY to have admin privileges
2. This is automatically available in Edge Functions
3. Redeploy: `supabase functions deploy create-driver`

## RLS Policies Required

Make sure these RLS policies exist on the `drivers` table:

```sql
-- Allow admin to manage drivers
CREATE POLICY drivers_admin_manage ON drivers FOR ALL
  USING (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'))
  WITH CHECK (exists (select 1 from profiles p where p.id = auth.uid()::uuid and p.role = 'admin'));

-- Allow drivers to view their own data
CREATE POLICY drivers_self_manage_select ON drivers FOR SELECT
  USING (profile_id = auth.uid()::uuid);

-- Allow drivers to update their own data
CREATE POLICY drivers_self_manage_update ON drivers FOR UPDATE
  USING (profile_id = auth.uid()::uuid)
  WITH CHECK (profile_id = auth.uid()::uuid);
```

## Testing Checklist

- [ ] Migration ran successfully
- [ ] Edge Function deployed
- [ ] Can load AdminDrivers page
- [ ] Form validation works
- [ ] Can create a new driver account
- [ ] New driver appears in list
- [ ] Can toggle status
- [ ] Can toggle availability
- [ ] Can delete a driver
- [ ] Toast notifications show
- [ ] Refresh page - driver persists

## Security Notes

✅ **Passwords**: Never stored in drivers table, only in auth.users
✅ **Admin Only**: Only admin users can create drivers (checked via RLS)
✅ **Service Role**: Edge Function uses SERVICE_ROLE_KEY for admin operations
✅ **Validation**: Frontend and Edge Function both validate input
✅ **CORS**: Properly configured for cross-origin requests

## Next Steps

1. Configure admin email in profiles with role='admin'
2. Test driver login with created credentials
3. Set up driver mobile app/interface for driver login
4. Add driver app integration for delivery tracking
