import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Determine the site URL for auth redirects
const siteUrl = import.meta.env.VITE_SITE_URL || 
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

console.log('🔧 Supabase environment check:', {
  url: supabaseUrl,
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'Missing',
  nodeEnv: import.meta.env.MODE,
  siteUrl
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  // Don't throw error, just log it - this allows the app to continue loading
  console.warn('⚠️ App will run in limited mode without Supabase connection');
}

// Validate URL format
try {
  if (supabaseUrl) {
    new URL(supabaseUrl);
  }
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  // Don't throw error, just log it
  console.warn('⚠️ App will run in limited mode without Supabase connection');
}

// Create client only if we have valid credentials
export const supabase = (supabaseUrl && supabaseAnonKey) ? 
  createClient(supabaseUrl, supabaseAnonKey, {
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
  }) : null;

// Enhanced connection testing function
export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Check if supabase client exists
    if (!supabase) {
      console.error('❌ Supabase client not initialized - missing environment variables');
      return { 
        success: false, 
        error: 'Supabase client not initialized. Please check your environment variables.' 
      };
    }
    
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
if (supabase) {
  console.log('🔗 Supabase client initialized', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey?.substring(0, 5) + '...',
    siteUrl
  });

  // Run connection test on initialization with retry
  let retryCount = 0;
  const maxRetries = 3;
  
  function testConnection() {
    testSupabaseConnection().then(result => {
      if (result.success) {
        console.log('✅ Supabase connection established successfully');
        window.dispatchEvent(new CustomEvent('supabase:connection:success'));
      } else {
        console.error(`❌ Supabase connection failed (attempt ${retryCount + 1}/${maxRetries}):`, result.error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying connection in ${retryCount * 2} seconds...`);
          setTimeout(testConnection, retryCount * 2000);
        } else {
          console.error('❌ All connection attempts failed');
          window.dispatchEvent(new CustomEvent('supabase:connection:error', { 
            detail: { message: result.error } 
          }));
        }
      }
    });
  }
  
  // Start the connection test process
  testConnection();
} else {
  console.warn('⚠️ Supabase client not initialized due to missing environment variables');
  window.dispatchEvent(new CustomEvent('supabase:connection:error', { 
    detail: { message: 'Missing Supabase environment variables' } 
  }));
}

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