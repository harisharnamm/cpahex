import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Determine the site URL for auth redirects
const siteUrl = import.meta.env.VITE_SITE_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

console.log('Environment check:', {
  url: supabaseUrl,
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'Missing',
  nodeEnv: import.meta.env.MODE,
  siteUrl
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, 
    flowType: 'pkce',
    // Add site URL for auth redirects
    site: siteUrl
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  // Add retry configuration for better reliability
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced connection testing function
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connectivity with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { 
        success: false, 
        error: `Database error: ${error.message}` 
      };
    }
    
    console.log('✅ Supabase connection test successful');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Supabase connection test failed with exception:', error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: 'Network error: Cannot reach Supabase. Please check your internet connection and Supabase URL.' 
      };
    }
    
    return { 
      success: false, 
      error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Test connection and log environment
console.log('🔗 Supabase client initialized', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
  siteUrl
});

// Run connection test on initialization
testSupabaseConnection().then(result => {
  if (result.success) {
    window.dispatchEvent(new CustomEvent('supabase:connection:success'));
  } else {
    window.dispatchEvent(new CustomEvent('supabase:connection:error', { 
      detail: { message: result.error } 
    }));
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