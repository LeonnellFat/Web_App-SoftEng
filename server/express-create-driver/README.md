# Express Create-Driver Admin Endpoint

This small Express app provides an admin-only `/create-driver` endpoint which uses the Supabase service role key to create:

- an Auth user (via `supabase.auth.admin.createUser`)
- a `profiles` row with `role = 'driver'`
- a `drivers` metadata row

Security: This endpoint requires a shared secret in header `x-admin-secret` which must match `ADMIN_SECRET` env var. Deploy this only to a trusted admin-only environment (server you control, VPC, or serverless with restricted access).

Environment variables (copy `.env.example` to `.env`):

- `SUPABASE_URL` - your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - service role key (keep secret)
- `ADMIN_SECRET` - a strong shared secret to protect the endpoint
- `PORT` - optional port for local testing

Run locally (for admin use only):

```powershell
cd server/express-create-driver
npm install
# copy .env.example -> .env and fill values
npm run start
```

Example curl (replace values):

```bash
curl -X POST http://localhost:4000/create-driver \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your_admin_secret_here" \
  -d '{
    "email":"driver@example.com",
    "password":"StrongP@ssw0rd",
    "fullName":"Juan Dela Cruz",
    "phone":"09123456789",
    "username":"juan_driver",
    "vehicleNumber":"ABC-1234",
    "licenseNumber":"DL12345"
  }'
```

Deployment suggestions:

- Deploy to a small admin-only server (DigitalOcean, EC2) or a serverless platform (Vercel/Netlify) but restrict access (VPC, auth, or IP allowlist).
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is stored securely in the deployment environment secrets.
- Remove the `ADMIN_SECRET` default and rotate it regularly.

If you prefer, I can help deploy this to a serverless provider and wire it into your admin UI so `AdminDrivers` calls this endpoint instead of the Edge Function.
