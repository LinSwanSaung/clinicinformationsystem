import { supabase } from './src/config/database.js';

async function checkPatients() {
  try {
    console.log('🔍 Checking patients in database...\n');
    
    const { data, error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching patients:', error);
      return;
    }

    console.log(`📊 Total patients found: ${count}\n`);

    if (data && data.length > 0) {
      console.log('👥 Recent patients:');
      console.log('==================');
      
      data.slice(0, 5).forEach((patient, index) => {
        console.log(`${index + 1}. ${patient.first_name} ${patient.last_name}`);
        console.log(`   Patient #: ${patient.patient_number}`);
        console.log(`   DOB: ${patient.date_of_birth}`);
        console.log(`   Phone: ${patient.phone || 'N/A'}`);
        console.log(`   Email: ${patient.email || 'N/A'}`);
        console.log(`   Emergency Contact: ${patient.emergency_contact_name || 'N/A'}`);
        console.log(`   Blood Group: ${patient.blood_group || 'N/A'}`);
        console.log(`   Allergies: ${patient.allergies || 'N/A'}`);
        console.log(`   Registered: ${new Date(patient.created_at).toLocaleString()}`);
        console.log('   ---');
      });
    } else {
      console.log('📭 No patients found in database');
    }

  } catch (error) {
    console.error('💥 Exception:', error);
  } finally {
    process.exit(0);
  }
}

checkPatients();
