import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local from project root
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([^=#]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
} else {
  console.warn('.env.local not found, falling back to process.env');
  env = process.env;
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or ANON KEY missing. Check .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    console.log('Attempting to insert a test order (this uses the anon key from .env.local)');

    const orderPayload = {
      user_id: null,
      order_number: 'TEST-ORD-001',
      total_amount: 1234,
      phone: '0000000000',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      payment: 'Cash',
      delivery_address: 'Test address',
      delivery_option: 'delivery'
    };

    const { data: insertedOrder, error: orderErr } = await supabase.from('orders').insert([orderPayload]).select().single();
    if (orderErr) {
      console.error('Order insert error:', orderErr);
      process.exitCode = 2;
      return;
    }

    console.log('Inserted order:', insertedOrder);

    const itemsPayload = [
      { order_id: insertedOrder.id, product_id: null, quantity: 1, price: 100 }
    ];

    const { data: insertedItems, error: itemsErr } = await supabase.from('order_items').insert(itemsPayload).select();
    if (itemsErr) {
      console.error('Order items insert error:', itemsErr);
      process.exitCode = 3;
      return;
    }

    console.log('Inserted items:', insertedItems);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exitCode = 99;
  }
}

run();
