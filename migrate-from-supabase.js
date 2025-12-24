#!/usr/bin/env node
/**
 * Data Migration Script: Supabase Cloud -> Local PostgreSQL
 * 
 * This script migrates all data from Supabase to your local PostgreSQL database.
 * 
 * Prerequisites:
 * 1. Local PostgreSQL must be running (docker compose up postgres)
 * 2. Supabase credentials must be available
 * 
 * Usage:
 *   node migrate-from-supabase.js
 * 
 * Environment variables:
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Your Supabase anon key
 *   POSTGRES_PASSWORD - Local PostgreSQL password (default: groupride_password_change_me)
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bvalntwatgqabwityroe.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YWxudHdhdGdxYWJ3aXR5cm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDU4ODksImV4cCI6MjA3NjE4MTg4OX0.umYova8KNPBC-hsKsdgH1puf0sttuvWnzTkUGAW5RM4';

const postgresConfig = {
    host: 'localhost',
    port: process.env.POSTGRES_PORT || 5434,  // Use 5434 to avoid conflict with other PostgreSQL instances
    database: 'groupride',
    user: 'groupride',
    password: process.env.POSTGRES_PASSWORD || 'groupride_password_change_me'
};

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey);
const pgClient = new Client(postgresConfig);

async function migrateData() {
    console.log('🔄 Starting data migration from Supabase to local PostgreSQL...\n');
    
    try {
        // Connect to local PostgreSQL
        await pgClient.connect();
        console.log('✅ Connected to local PostgreSQL\n');

        // 1. Migrate events
        console.log('📦 Migrating events...');
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: true });

        if (eventsError) throw eventsError;

        if (events && events.length > 0) {
            for (const event of events) {
                await pgClient.query(
                    `INSERT INTO events (id, name, description, date, time, password_hash, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (id) DO UPDATE SET
                     name = EXCLUDED.name,
                     description = EXCLUDED.description,
                     date = EXCLUDED.date,
                     time = EXCLUDED.time,
                     password_hash = EXCLUDED.password_hash`,
                    [event.id, event.name, event.description || null, event.date, event.time, event.password_hash || null, event.created_at]
                );
            }
            console.log(`   ✅ Migrated ${events.length} events`);
        } else {
            console.log('   ℹ️  No events to migrate');
        }

        // 2. Migrate cars
        console.log('\n📦 Migrating cars...');
        const { data: cars, error: carsError } = await supabase
            .from('cars')
            .select('*')
            .order('created_at', { ascending: true });

        if (carsError) throw carsError;

        if (cars && cars.length > 0) {
            for (const car of cars) {
                await pgClient.query(
                    `INSERT INTO cars (id, event_id, driver_name, driver_phone, driver_email, car_model, 
                     available_seats, occupied_seats, requires_pin, car_pin, pickup_address, dropoff_address, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                     ON CONFLICT (id) DO UPDATE SET
                     event_id = EXCLUDED.event_id,
                     driver_name = EXCLUDED.driver_name,
                     driver_phone = EXCLUDED.driver_phone,
                     driver_email = EXCLUDED.driver_email,
                     car_model = EXCLUDED.car_model,
                     available_seats = EXCLUDED.available_seats,
                     occupied_seats = EXCLUDED.occupied_seats,
                     requires_pin = EXCLUDED.requires_pin,
                     car_pin = EXCLUDED.car_pin,
                     pickup_address = EXCLUDED.pickup_address,
                     dropoff_address = EXCLUDED.dropoff_address`,
                    [car.id, car.event_id, car.driver_name, car.driver_phone || null, car.driver_email || null,
                     car.car_model, car.available_seats, car.occupied_seats || 0, car.requires_pin || false,
                     car.car_pin || null, car.pickup_address || null, car.dropoff_address || null, car.created_at]
                );
            }
            console.log(`   ✅ Migrated ${cars.length} cars`);
        } else {
            console.log('   ℹ️  No cars to migrate');
        }

        // 3. Migrate ride requests
        console.log('\n📦 Migrating ride requests...');
        const { data: rideRequests, error: rideRequestsError } = await supabase
            .from('ride_requests')
            .select('*')
            .order('created_at', { ascending: true });

        if (rideRequestsError) throw rideRequestsError;

        if (rideRequests && rideRequests.length > 0) {
            for (const request of rideRequests) {
                await pgClient.query(
                    `INSERT INTO ride_requests (id, event_id, contact_name, contact_phone, notes, 
                     pickup_address, dropoff_address, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (id) DO UPDATE SET
                     event_id = EXCLUDED.event_id,
                     contact_name = EXCLUDED.contact_name,
                     contact_phone = EXCLUDED.contact_phone,
                     notes = EXCLUDED.notes,
                     pickup_address = EXCLUDED.pickup_address,
                     dropoff_address = EXCLUDED.dropoff_address`,
                    [request.id, request.event_id, request.contact_name, request.contact_phone || null,
                     request.notes || null, request.pickup_address || null, request.dropoff_address || null, request.created_at]
                );
            }
            console.log(`   ✅ Migrated ${rideRequests.length} ride requests`);
        } else {
            console.log('   ℹ️  No ride requests to migrate');
        }

        // 4. Migrate ride request passengers
        console.log('\n📦 Migrating ride request passengers...');
        const { data: passengers, error: passengersError } = await supabase
            .from('ride_request_passengers')
            .select('*')
            .order('created_at', { ascending: true });

        if (passengersError) throw passengersError;

        if (passengers && passengers.length > 0) {
            for (const passenger of passengers) {
                await pgClient.query(
                    `INSERT INTO ride_request_passengers (id, request_id, name, status, assigned_car_id, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (id) DO UPDATE SET
                     request_id = EXCLUDED.request_id,
                     name = EXCLUDED.name,
                     status = EXCLUDED.status,
                     assigned_car_id = EXCLUDED.assigned_car_id`,
                    [passenger.id, passenger.request_id, passenger.name, passenger.status || 'waiting',
                     passenger.assigned_car_id || null, passenger.created_at]
                );
            }
            console.log(`   ✅ Migrated ${passengers.length} ride request passengers`);
        } else {
            console.log('   ℹ️  No ride request passengers to migrate');
        }

        // 5. Migrate passengers
        console.log('\n📦 Migrating passengers...');
        const { data: carPassengers, error: carPassengersError } = await supabase
            .from('passengers')
            .select('*')
            .order('created_at', { ascending: true });

        if (carPassengersError) throw carPassengersError;

        if (carPassengers && carPassengers.length > 0) {
            for (const passenger of carPassengers) {
                await pgClient.query(
                    `INSERT INTO passengers (id, car_id, name, seat_index, request_passenger_id, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (id) DO UPDATE SET
                     car_id = EXCLUDED.car_id,
                     name = EXCLUDED.name,
                     seat_index = EXCLUDED.seat_index,
                     request_passenger_id = EXCLUDED.request_passenger_id`,
                    [passenger.id, passenger.car_id, passenger.name, passenger.seat_index,
                     passenger.request_passenger_id || null, passenger.created_at]
                );
            }
            console.log(`   ✅ Migrated ${carPassengers.length} passengers`);
        } else {
            console.log('   ℹ️  No passengers to migrate');
        }

        console.log('\n✨ Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Update your .env or environment to use local PostgREST');
        console.log('   2. Set VITE_SUPABASE_URL=http://localhost:3000');
        console.log('   3. Set VITE_SUPABASE_ANON_KEY=any_string (PostgREST doesn\'t use it)');
        console.log('   4. Restart your application\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pgClient.end();
    }
}

migrateData();

