import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment check:', {
  url: supabaseUrl,
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'Missing',
  nodeEnv: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
});

// Test connection and log environment
console.log('🔗 Supabase client initialized', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
});

// Enhanced connection testing with better recovery options
let connectionTestRunning = true;

// First try with a short timeout for quick feedback
Promise.race([
  supabase.auth.getSession(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (initial)')), 5000))
]).then((result: any) => {
  const { data, error } = result;
  connectionTestRunning = false;
  
  console.log('🔍 Initial session check (fast):', { 
    hasSession: !!data?.session, 
    userId: data?.session?.user?.id,
    error: error?.message 
  });
  
  // Return success flag to any listeners
  window.dispatchEvent(new CustomEvent('supabase:connection:success'));
}).catch((error: Error) => {
  console.warn('⚠️ Fast connection test failed, trying with longer timeout:', error.message);
  
  // Try again with a longer timeout as backup
  if (connectionTestRunning) {
    Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (extended)')), 15000))
    ]).then((result: any) => {
      const { data, error } = result;
      connectionTestRunning = false;
      
      console.log('🔍 Extended session check:', { 
        hasSession: !!data?.session, 
        userId: data?.session?.user?.id,
        error: error?.message 
      });
      
      // Return success flag to any listeners
      window.dispatchEvent(new CustomEvent('supabase:connection:success'));
    }).catch((finalError: Error) => {
      connectionTestRunning = false;
      console.error('❌ Session check failed after extended timeout:', finalError.message);
      
      // Signal connection issue to listeners
      window.dispatchEvent(new CustomEvent('supabase:connection:error', { 
        detail: { message: finalError.message } 
      }));
    });
  }
});

// Types
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile?: Profile;
}