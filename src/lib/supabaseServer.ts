import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates and returns a Supabase client for use in Server Components.
 * This client is configured to manage cookies for SSR (Server-Side Rendering)
 * by interacting with `next/headers` cookies.
 *
 * @returns {Promise<ReturnType<typeof createServerClient>>} A Promise that resolves to
 *          an initialized Supabase client instance for server-side operations.
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        // Supabase project URL retrieved from environment variables.
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        // Supabase anonymous key retrieved from environment variables.
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                /**
                 * Retrieves all cookies from the cookie store.
                 * @returns {CookieOptions[]} An array of cookie objects.
                 */
                getAll() {
                    return cookieStore.getAll()
                },
                /**
                 * Sets multiple cookies to the cookie store.
                 * This method handles potential errors when called from Server Components,
                 * which might not have direct access to set cookies if middleware
                 * is already handling session refreshing.
                 * @param {Array<{ name: string; value: string; options: CookieOptions }>} cookiesToSet - An array of cookies to set.
                 */
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
