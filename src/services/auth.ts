// src/services/auth.ts
import supabase from './supabaseClient';

export async function signInWithEmail(email: string, password: string) {
  const resp = await supabase.auth.signInWithPassword({ email, password });
  if (resp.error) return { error: resp.error, user: null };
  const user = resp.data.user;

  // fetch profile row
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, phone, role')
    .eq('id', user?.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 is "No rows found" in PostgREST responses sometimes — ignore if no profile
    return { error: profileError, user: user ?? null };
  }

  return { user, profile: profile ?? null, error: null };
}

export async function signUpWithEmail(email: string, password: string, fullName?: string, phone?: string) {
  const resp = await supabase.auth.signUp({ email, password });
  if (resp.error) return { error: resp.error, user: null };
  const user = resp.data.user;

  if (user) {
    // create or update profile row (default role = 'user', address starts empty)
    const { data: profile, error: upErr } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName ?? null,
      email: email,
      phone: phone ?? null,
      address: "",
      role: 'user'
    }).select().single();

    if (upErr) {
      console.error('Failed to upsert profile after sign up', upErr);
      return { error: upErr, user: null };
    }

    return { user, profile, error: null };
  }

  return { user: null, profile: null, error: new Error('No user created') };
}
