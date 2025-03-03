// src/services/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials');
}

// Initialize with anon key for initial connection
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Function to initialize with custom JWT token
export const initSupabaseAuth = (token: string) => {
  if (token) {
    // Set the auth token for realtime subscription
    supabase.realtime.setAuth(token);
    return true;
  } else {
    console.log("No JWT token provided for Supabase");
    return false;
  }
};

// Helper function to subscribe to agent_runs updates for a specific user
export const subscribeToAgentRuns = (userId: string, onUpdate: (payload: any) => void) => {
  // Create subscription with filter for specific user
  const channel = supabase
    .channel('agent-runs')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'agent_runs',
        filter: `user_id=eq.${userId}`
      },
      (payload) => onUpdate(payload)
    )
    .subscribe((status) => {
      console.log(`Realtime subscription status: ${status}`);
    });

  // Return unsubscribe function
  return () => {
    channel.unsubscribe();
  };
};

export default supabase;