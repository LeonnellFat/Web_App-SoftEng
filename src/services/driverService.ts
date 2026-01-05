// src/services/driverService.ts
// Frontend service for driver management

import supabase from "./supabaseClient";

export interface Driver {
  id: string;
  profileId: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  vehicleNumber: string;
  licenseNumber?: string;
  status: "active" | "inactive";
  isAvailable: boolean;
  deliveries: number;
  rating: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDriverInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  username: string;
  vehicleNumber: string;
  licenseNumber?: string;
}

/**
 * Create a new driver account directly in Supabase Authentication
 * Creates an auth user + driver record (profile auto-created by trigger)
 */
export async function createDriver(input: CreateDriverInput) {
  try {
    console.log("Creating driver with input:", { email: input.email, fullName: input.fullName });

    // Step 1: Create auth user (profile will be created automatically by trigger)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
          username: input.username,
        },
      },
    } as any);

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('Failed to create auth user: no user ID returned');
    }

    console.log('Auth user created with ID:', userId);

    // Step 2: Create driver record (profile is created automatically by trigger)
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .insert({
        profile_id: userId,
        username: input.username,
        vehicle_number: input.vehicleNumber,
        license_number: input.licenseNumber || null,
        status: 'active',
        is_available: true,
        deliveries: 0,
        rating: 0,
      })
      .select()
      .single();

    if (driverError) {
      console.error('Error creating driver record:', driverError);
      throw driverError;
    }

    console.log('Driver record created:', driverData);

    return {
      userId,
      email: input.email,
      username: input.username,
      fullName: input.fullName,
      message: 'Driver account created successfully!',
    };
  } catch (error) {
    console.error('Error in createDriver:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}


/**
 * Fetch all drivers with their profiles
 */
export async function fetchDrivers(): Promise<Driver[]> {
  try {
    const { data, error } = await supabase
      .from("drivers")
      .select(
        `
        id,
        profile_id,
        username,
        vehicle_number,
        license_number,
        status,
        is_available,
        deliveries,
        rating,
        created_at,
        updated_at,
        profiles(
          id,
          full_name,
          email,
          phone
        )
      `
      );

    if (error) throw error;

    return (data as any[]).map((driver) => {
      const profile = Array.isArray(driver.profiles) ? driver.profiles[0] : driver.profiles;
      return {
        id: driver.id,
        profileId: driver.profile_id,
        name: profile?.full_name || "Unknown",
        email: profile?.email || "",
        username: driver.username,
        phone: profile?.phone || "",
        vehicleNumber: driver.vehicle_number,
        licenseNumber: driver.license_number,
        status: driver.status,
        isAvailable: driver.is_available,
        deliveries: driver.deliveries,
        rating: driver.rating,
        createdAt: driver.created_at,
        updatedAt: driver.updated_at,
      };
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    throw error;
  }
}

/**
 * Update driver status and availability
 */
export async function updateDriver(
  driverId: string,
  updates: {
    status?: "active" | "inactive";
    isAvailable?: boolean;
    vehicleNumber?: string;
    licenseNumber?: string;
  }
) {
  try {
    const updatePayload: any = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.isAvailable !== undefined) updatePayload.is_available = updates.isAvailable;
    if (updates.vehicleNumber !== undefined) updatePayload.vehicle_number = updates.vehicleNumber;
    if (updates.licenseNumber !== undefined) updatePayload.license_number = updates.licenseNumber;
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("drivers")
      .update(updatePayload)
      .eq("id", driverId)
      .select(`
        id,
        profile_id,
        username,
        vehicle_number,
        license_number,
        status,
        is_available,
        deliveries,
        rating,
        created_at,
        updated_at,
        profiles(
          id,
          full_name,
          email,
          phone
        )
      `)
      .single();

    if (error) throw error;
    
    // Map response to Driver interface
    if (data) {
      const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
      return {
        id: data.id,
        profileId: data.profile_id,
        name: profile?.full_name || "Unknown",
        email: profile?.email || "",
        username: data.username,
        phone: profile?.phone || "",
        vehicleNumber: data.vehicle_number,
        licenseNumber: data.license_number,
        status: data.status,
        isAvailable: data.is_available,
        deliveries: data.deliveries,
        rating: data.rating,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (error) {
    console.error("Error updating driver:", error);
    throw error;
  }
}

/**
 * Delete driver account (requires admin privileges)
 * Note: Deleting profile cascades to driver record
 */
export async function deleteDriver(profileId: string) {
  try {
    // Delete from profiles (cascade will delete driver record)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId)
      .eq("role", "driver");

    if (error) throw error;

    // Note: Auth user deletion should be done via Edge Function with admin key
    // This is a limitation of client-side Supabase auth
    return true;
  } catch (error) {
    console.error("Error deleting driver:", error);
    throw error;
  }
}

/**
 * Subscribe to driver changes (realtime)
 */
export function subscribeToDrivers(callback: (drivers: Driver[]) => void) {
  const subscription = supabase
    .channel("drivers-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "drivers",
      },
      async () => {
        const drivers = await fetchDrivers();
        callback(drivers);
      }
    )
    .subscribe();

  return subscription;
}
