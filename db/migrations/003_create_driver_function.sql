-- Create a PostgreSQL function that creates a driver account
-- Call this in Supabase SQL Editor

create or replace function public.create_driver_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text,
  p_username text,
  p_vehicle_number text,
  p_license_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_driver_id uuid;
begin
  -- Check if user is admin
  if not exists (
    select 1 from profiles 
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only admins can create driver accounts';
  end if;

  -- Create auth user via Supabase trigger
  -- Note: This won't work from RPC, so we'll use a different approach
  
  return jsonb_build_object(
    'success', false,
    'message', 'Use Edge Function instead'
  );
end;
$$;
