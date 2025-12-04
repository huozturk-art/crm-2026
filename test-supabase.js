const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection failed:', error.message);
            // Check if it's a 404 which might mean table doesn't exist yet (schema not run)
            if (error.code === '42P01') {
                console.log('Connection successful, but "profiles" table not found. Did you run the schema SQL?');
            }
        } else {
            console.log('Connection successful! Supabase is reachable.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
