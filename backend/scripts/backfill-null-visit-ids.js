import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Use the existing database config
const supabase = config;

async function backfillNullVisitIds() {
  console.log('🔍 Finding tokens with NULL visit_id...\n');
  
  try {
    // Get tokens with NULL visit_id
    const { data: tokensWithoutVisits, error: fetchError } = await supabase
      .from('queue_tokens')
      .select('id, patient_id, doctor_id, status, issued_date, token_number')
      .is('visit_id', null)
      .order('issued_date', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching tokens:', fetchError);
      return;
    }

    console.log(`📊 Found ${tokensWithoutVisits?.length || 0} tokens without visit_id`);

    if (!tokensWithoutVisits || tokensWithoutVisits.length === 0) {
      console.log('✅ All tokens have visit_ids!');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const token of tokensWithoutVisits) {
      console.log(`\n🔄 Processing Token #${token.token_number} (${token.id.substring(0, 8)}...)...`);
      console.log(`   Patient: ${token.patient_id.substring(0, 8)}...`);
      console.log(`   Doctor: ${token.doctor_id.substring(0, 8)}...`);
      console.log(`   Status: ${token.status}`);

      try {
        // Create a NEW visit for this token
        const { data: newVisit, error: createError } = await supabase
          .from('visits')
          .insert({
            patient_id: token.patient_id,
            doctor_id: token.doctor_id,
            visit_date: token.issued_date,
            visit_type: 'walk-in',
            status: token.status === 'completed' ? 'completed' : 'in_progress',
            payment_status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          console.error(`   ❌ Failed to create visit:`, createError.message);
          failCount++;
          continue;
        }

        console.log(`   ✨ Created new visit: ${newVisit.id.substring(0, 8)}...`);

        // Update token with visit_id
        const { error: updateError } = await supabase
          .from('queue_tokens')
          .update({ visit_id: newVisit.id })
          .eq('id', token.id);

        if (updateError) {
          console.error(`   ❌ Failed to update token:`, updateError.message);
          failCount++;
        } else {
          console.log(`   ✅ Token updated successfully!`);
          successCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error processing token:`, error.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Backfill complete!');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    throw error;
  }
}

backfillNullVisitIds()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Script failed:', err);
    process.exit(1);
  });
