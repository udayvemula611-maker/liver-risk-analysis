import { createBrowserClient } from '@supabase/ssr'

// Retrieve Supabase URL from environment variables.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Retrieve Supabase anonymous key from environment variables.
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Initializes and exports a Supabase client for use in browser/client components.
 * This client is configured for Server-Side Rendering (SSR) and automatically
 * manages authentication cookies.
 *
 * @remarks
 * This client is specifically designed for client-side operations and
 * automatically handles session management for SSR compatibility.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
