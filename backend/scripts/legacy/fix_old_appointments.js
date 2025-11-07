import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixOldAppointments() {
  try {
    console.log('🔧 Fixing old appointment queue entries...\n');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Get all OLD appointment queue entries (before today) that are still "queued"
    const { data: oldEntries, error: fetchError } = await supabase
      .from('appointment_queue')
      .select(`
        id,
        queue_position,
        status,
        appointment:appointments!appointment_id(
          appointment_date
        )
      `)
      .eq('status', 'queued')
      .lt('appointment.appointment_date', today);
    
    if (fetchError) throw fetchError;
    
    console.log(`\nFound ${oldEntries.length} old appointments still marked as "queued"`);
    
    if (oldEntries.length > 0) {
      // Update all old entries to "completed"
      const { data: updated, error: updateError } = await supabase
        .from('appointment_queue')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', oldEntries.map(e => e.id))
        .select();
      
      if (updateError) throw updateError;
      
      console.log(`\n✅ Updated ${updated.length} old appointments to "completed"`);
      console.log('\nUpdated entries:');
      updated.forEach(entry => {
        console.log(`  - Queue ID: ${entry.id}, Position: ${entry.queue_position} -> Status: ${entry.status}`);
      });
    } else {
      console.log('\n✅ No old appointments to fix');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixOldAppointments();
