import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qppuhasdsxyuipkuusnn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcHVoYXNkc3h5dWlwa3V1c25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDU3MTQsImV4cCI6MjA3MjA4MTcxNH0.Y97D9_I3qN6xyWFTYy2046pE-B9P_9PT4R41VJ2KlIg';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
