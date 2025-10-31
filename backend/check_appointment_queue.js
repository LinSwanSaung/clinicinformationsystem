import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkAppointmentQueue() {
  try {
    console.log('🔍 Checking appointment_queue for Nyan Pyae...\n');
    
    // Get all appointments for Nyan Pyae
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .ilike('first_name', '%Nyan%')
      .ilike('last_name', '%Pyae%');
    
    if (patientError) throw patientError;
    
    console.log('Found patients:', patients);
    
    if (patients.length > 0) {
      const patientId = patients[0].id;
      
      // Get all appointment queue entries for this patient
      const { data: queueEntries, error: queueError } = await supabase
        .from('appointment_queue')
        .select(`
          *,
          appointment:appointments!appointment_id(
            appointment_date,
            appointment_time,
            status
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (queueError) throw queueError;
      
      console.log('\n📋 Appointment Queue Entries:');
      console.log(JSON.stringify(queueEntries, null, 2));
      
      console.log('\n\n📊 Summary:');
      queueEntries.forEach((entry, index) => {
        console.log(`\n${index + 1}. Queue Position: ${entry.queue_position}`);
        console.log(`   Queue Status: ${entry.status}`);
        console.log(`   Appointment Date: ${entry.appointment?.appointment_date}`);
        console.log(`   Appointment Time: ${entry.appointment?.appointment_time}`);
        console.log(`   Appointment Status: ${entry.appointment?.status}`);
        console.log(`   Created: ${entry.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAppointmentQueue();
