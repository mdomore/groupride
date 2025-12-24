#!/usr/bin/env node
/**
 * Database Migration Helper
 * 
 * Displays the SQL migration that needs to be run in Supabase.
 * 
 * Usage:
 *   node migrate-database.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showMigration() {
    console.log('🔄 Database Migration: Add Event Password Protection\n');
    console.log('═'.repeat(70));
    
    try {
        // Read the SQL migration file
        const sqlPath = join(__dirname, 'SQL', '05-add-event-password.sql');
        const sql = readFileSync(sqlPath, 'utf-8');
        
        console.log('\n📋 SQL to execute in Supabase:\n');
        console.log('─'.repeat(70));
        console.log(sql);
        console.log('─'.repeat(70));
        
        console.log('\n✅ Steps to apply this migration:\n');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Navigate to SQL Editor (left sidebar)');
        console.log('4. Click "New query"');
        console.log('5. Copy and paste the SQL above');
        console.log('6. Click "Run" (or press Ctrl+Enter)');
        console.log('\n✨ The migration will add password_hash column to events table.');
        console.log('   Existing events will have NULL password_hash (no password required).\n');
        
    } catch (error) {
        console.error('❌ Error reading migration file:', error.message);
        process.exit(1);
    }
}

showMigration();

