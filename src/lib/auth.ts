import { createClient } from './supabaseServer'

/**
 * Fetches the authenticated user's information, including their role and full name
 * from the 'profiles' table.
 *
 * @returns {Promise<User | null>} A Promise that resolves to the user object
 *                                  with role and full_name, or null if no user
 *                                  is authenticated or an error occurs.
 */
export async function getUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    // Fetch the role and full name from the profiles table
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

    return {
        ...user,
        role: userProfile?.role || 'patient',
        full_name: userProfile?.full_name || ''
    }
}

/**
 * Checks if the authenticated user has one of the allowed roles.
 *
 * @param {string[]} allowedRoles - An array of roles that are permitted to access a resource.
 * @returns {Promise<User | false>} A Promise that resolves to the user object if
 *                                   the user has an allowed role, or false otherwise.
 */
export async function checkRole(allowedRoles: string[]) {
    const user = await getUser()
    if (!user || !allowedRoles.includes(user.role)) {
        return false
    }
    return user
}
