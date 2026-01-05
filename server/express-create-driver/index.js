require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET; // simple shared secret to protect this endpoint

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

if (!ADMIN_SECRET) {
  console.warn('ADMIN_SECRET not set. Endpoint will reject all requests without valid header.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

app.get('/', (req, res) => res.json({ ok: true, message: 'Create-driver admin endpoint' }));

app.post('/create-driver', async (req, res) => {
  try {
    // Basic admin protection: require x-admin-secret header
    const headerSecret = req.header('x-admin-secret');
    if (!ADMIN_SECRET || headerSecret !== ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      email,
      password,
      fullName,
      phone,
      username,
      vehicleNumber,
      licenseNumber,
    } = req.body || {};

    if (!email || !password || !fullName || !username || !vehicleNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1) Create auth user using admin API
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
      console.error('Auth creation error', authError);
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    // 2) Insert profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        email,
        phone,
        role: 'driver',
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error', profileError);
      // cleanup auth user
      try { await supabase.auth.admin.deleteUser(userId); } catch (e) { console.error('Cleanup deleteUser failed', e); }
      return res.status(400).json({ error: profileError.message });
    }

    // 3) Insert drivers metadata
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .insert({
        profile_id: userId,
        username,
        vehicle_number: vehicleNumber,
        license_number: licenseNumber || null,
        status: 'active',
        is_available: true,
        deliveries: 0,
        rating: 0.0,
      })
      .select()
      .single();

    if (driverError) {
      console.error('Driver creation error', driverError);
      // cleanup
      try { await supabase.from('profiles').delete().eq('id', userId); } catch (e) { console.error('Cleanup delete profile failed', e); }
      try { await supabase.auth.admin.deleteUser(userId); } catch (e) { console.error('Cleanup deleteUser failed', e); }
      return res.status(400).json({ error: driverError.message });
    }

    return res.status(201).json({ success: true, userId, profileId: userId, driverId: driverData.id });
  } catch (err) {
    console.error('Unexpected error in /create-driver', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
