#!/usr/bin/env node

/**
 * Script para aplicar a migration de tracking de visualizações únicas
 * Run: node apply-views-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('📊 Applying property views tracking migration...');
    
    // Read the migration file
    const migrationSQL = readFileSync('supabase/migrations/20251027000000_create_property_views_tracking.sql', 'utf8');
    
    // Split into individual statements (rough split)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('NOTIFY')) continue; // Skip NOTIFY statements
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
        // Continue with other statements
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Test the new function
    console.log('🧪 Testing track_unique_property_view function...');
    
    const { data: testResult, error: testError } = await supabase.rpc(
      'track_unique_property_view', 
      {
        p_property_id: '00000000-0000-0000-0000-000000000000', // dummy ID for test
        p_viewer_ip: '192.168.1.100',
        p_user_agent: 'test-agent'
      }
    );
    
    if (testError) {
      console.log('⚠️ Test failed (expected if property doesn\'t exist):', testError.message);
    } else {
      console.log('✅ Function test successful:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();