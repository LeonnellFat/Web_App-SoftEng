// supabase/functions/create-driver/index.ts
// Edge Function to create driver account with admin privileges
// Called from frontend with email, password, and driver info
// @ts-ignore - ESM imports from esm.sh work fine at runtime with Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

// @ts-ignore: Deno globals
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
// @ts-ignore: Deno globals
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Received request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers));
    
    const body = await req.json();
    console.log("Request body parsed:", body);
    
    const {
      email,
      password,
      fullName,
      phone,
      username,
      vehicleNumber,
      licenseNumber,
    } = body;

    // Validate input
    if (!email || !password || !fullName || !username || !vehicleNumber) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, password, fullName, username, vehicleNumber",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase admin client (service role key has admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create auth user
    console.log(`Creating auth user for ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        username,
      },
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    const userId = authData.user.id;
    console.log(`Auth user created: ${userId}`);

    // Step 2: Insert profile with role = 'driver'
    console.log(`Inserting profile for user ${userId}...`);
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        email,
        phone,
        role: "driver",
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Attempt to delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Profile created: ${profileData.id}`);

    // Step 3: Insert driver metadata
    console.log(`Inserting driver metadata...`);
    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .insert({
        profile_id: userId,
        username,
        vehicle_number: vehicleNumber,
        license_number: licenseNumber || null,
        status: "active",
        is_available: true,
        deliveries: 0,
        rating: 0.0,
      })
      .select()
      .single();

    if (driverError) {
      console.error("Driver metadata creation error:", driverError);
      // Attempt cleanup if driver creation fails
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Failed to create driver metadata: ${driverError.message}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Driver created: ${driverData.id}`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Driver account created successfully",
        data: {
          userId,
          profileId: userId,
          driverId: driverData.id,
          email,
          username,
          fullName,
        },
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
