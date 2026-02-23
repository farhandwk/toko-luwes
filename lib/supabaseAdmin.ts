import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Supabase key is missing")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey)