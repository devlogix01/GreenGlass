// Supabase Client Configuration
// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://aulgnawdyofovayykfco.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ne5yk1t0pyV-3462MbcsEQ_qoXqPJ-b';

// Wait for Supabase library to load
(function initSupabase() {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded. Make sure the CDN script is included before this file.');
        return;
    }

    // Validate configuration
    if (!SUPABASE_URL || SUPABASE_URL === 'https://aulgnawdyofovayykfco.supabase.co') {
        console.error('❌ Supabase URL is not configured. Please update SUPABASE_URL in supabaseClient.js');
        console.log('📖 See SUPABASE_SETUP_GUIDE.md for configuration instructions');
    }

    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'sb_publishable_Ne5yk1t0pyV-3462MbcsEQ_qoXqPJ-b') {
        console.error('❌ Supabase Anon Key is not configured. Please update SUPABASE_ANON_KEY in supabaseClient.js');
        console.log('📖 See SUPABASE_SETUP_GUIDE.md for configuration instructions');
    }

    // Initialize Supabase client
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');
        console.log('🔗 Connected to:', SUPABASE_URL);
    } catch (error) {
        console.error('❌ Error initializing Supabase client:', error);
        console.log('📖 Please check your configuration in supabaseClient.js');
    }
})();