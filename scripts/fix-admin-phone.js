const { queryDb } = require('../src/lib/db');

async function fixSettings() {
  try {
    await queryDb(
      `INSERT INTO public.admin_settings (key, value, updated_at) 
       VALUES ('helpline_phone', '+91 7096093039', NOW()), 
              ('whatsapp_number', '+91 7096093039', NOW()) 
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`
    );
    console.log("Successfully updated admin_settings in DB to +91 7096093039");
  } catch (err) {
    console.error("DB error:", err);
  }
}

fixSettings();
