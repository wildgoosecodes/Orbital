require('dotenv').config();

// Public values (same anon key already embedded in the deployed web app's JS bundle —
// safe to ship inside the installed app; access is scoped by Supabase RLS, not by key secrecy).
// .env overrides these for local dev (e.g. pointing at local Supabase instead of production).
const DEFAULT_SUPABASE_URL = 'https://nzekuszwophatjzbkeej.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZWt1c3p3b3BoYXRqemJrZWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDk3NzQsImV4cCI6MjEwMDQyNTc3NH0.N6yVXJjyE2PldkSNam-S3Vpb4M_LshviiHLHwtadKys';

module.exports = {
  SUPABASE_URL: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
};
