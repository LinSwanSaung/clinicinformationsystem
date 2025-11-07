// Script to fix existing tokens that have null visit_id
// This creates visits for tokens that don't have them

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixExistingTokens() {
  try {
    console.log('🔍 Finding tokens with null visit_id...');
    
    // Get all tokens with null visit_id that are still active today
    const today = new Date().toISOString().split('T')[0];
    const { data: tokensWithoutVisits, error: tokenError } = await supabase
      .from('queue_tokens')
      .select('*')
      .eq('issued_date', today)
      .is('visit_id', null)
      .in('status', ['waiting', 'called', 'serving']);
    
    if (tokenError) {
      console.error('Error fetching tokens:', tokenError);
      return;
    }
    
    console.log(`📋 Found ${tokensWithoutVisits.length} tokens without visit_id`);
    
    for (const token of tokensWithoutVisits) {
      console.log(`\n🔧 Processing Token #${token.token_number} (Patient: ${token.patient_id})`);
      
      // Check if patient already has an active visit today
      const { data: existingVisit, error: visitCheckError } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', token.patient_id)
        .eq('status', 'in_progress')
        .gte('visit_date', `${today}T00:00:00`)
        .lte('visit_date', `${today}T23:59:59`)
        .maybeSingle();
      
      let visitId;
      
      if (existingVisit) {
        console.log(`  ♻️ Reusing existing visit: ${existingVisit.id}`);
        visitId = existingVisit.id;
      } else {
        // Create a new visit
        console.log(`  ➕ Creating new visit...`);
        const { data: newVisit, error: createError } = await supabase
          .from('visits')
          .insert({
            patient_id: token.patient_id,
            doctor_id: token.doctor_id,
            appointment_id: token.appointment_id,
            visit_type: token.appointment_id ? 'appointment' : 'walk_in',
            visit_date: new Date().toISOString(),
            status: 'in_progress',
            payment_status: 'pending'
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`  ❌ Failed to create visit:`, createError.message);
          continue;
        }
        
        visitId = newVisit.id;
        console.log(`  ✅ Created visit: ${visitId}`);
      }
      
      // Update the token with the visit_id
      const { error: updateError } = await supabase
        .from('queue_tokens')
        .update({ visit_id: visitId })
        .eq('id', token.id);
      
      if (updateError) {
        console.error(`  ❌ Failed to update token:`, updateError.message);
      } else {
        console.log(`  ✅ Token updated with visit_id: ${visitId}`);
      }
    }
    
    console.log('\n✨ Done! All tokens have been updated.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixExistingTokens();
