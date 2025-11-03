/**
 * Cleanup script to remove test tokens and reset appointments
 * Use this when testing the receptionist dashboard
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestTokens() {
  try {
    console.log('🧹 Starting cleanup of test tokens...\n');

    // 1. Get today's tokens
    const today = new Date().toISOString().split('T')[0];
    
    const { data: tokens, error: tokensError } = await supabase
      .from('queue_tokens')
      .select('*, patient:patients(first_name, last_name)')
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });

    if (tokensError) {
      throw tokensError;
    }

    console.log(`Found ${tokens.length} tokens for today:\n`);
    tokens.forEach(token => {
      console.log(`- Token #${token.token_number}: ${token.patient?.first_name} ${token.patient?.last_name} - Status: ${token.status}`);
    });

    // 2. Delete all today's tokens
    const { error: deleteError } = await supabase
      .from('queue_tokens')
      .delete()
      .gte('created_at', `${today}T00:00:00`);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`\n✅ Deleted ${tokens.length} tokens\n`);

    // 3. Reset today's appointments to 'scheduled' status
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*, patient:patients(first_name, last_name)')
      .eq('appointment_date', today)
      .in('status', ['waiting', 'in_progress', 'late']);

    if (appointmentsError) {
      throw appointmentsError;
    }

    console.log(`Found ${appointments.length} appointments to reset:\n`);
    appointments.forEach(apt => {
      console.log(`- ${apt.patient?.first_name} ${apt.patient?.last_name} at ${apt.appointment_time} - Current status: ${apt.status}`);
    });

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'scheduled' })
      .eq('appointment_date', today)
      .in('status', ['waiting', 'in_progress', 'late']);

    if (updateError) {
      throw updateError;
    }

    console.log(`\n✅ Reset ${appointments.length} appointments to 'scheduled' status\n`);

    // 4. Update visits to 'cancelled' status (optional - keeps visit records)
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('id, patient_id')
      .eq('visit_date', today)
      .eq('status', 'in_progress');

    if (!visitsError && visits.length > 0) {
      const { error: visitUpdateError } = await supabase
        .from('visits')
        .update({ status: 'cancelled' })
        .eq('visit_date', today)
        .eq('status', 'in_progress');

      if (!visitUpdateError) {
        console.log(`✅ Marked ${visits.length} visits as cancelled\n`);
      }
    }

    console.log('🎉 Cleanup complete! You can now test the receptionist dashboard.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupTestTokens()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
