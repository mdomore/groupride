// Supabase configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bvalntwatgqabwityroe.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YWxudHdhdGdxYWJ3aXR5cm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDU4ODksImV4cCI6MjA3NjE4MTg4OX0.umYova8KNPBC-hsKsdgH1puf0sttuvWnzTkUGAW5RM4'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database operations
export class DatabaseService {
    // Event operations
    static async createEvent(event) {
        const { data, error } = await supabase
            .from('events')
            .insert([event])
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async getEvent(eventId) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()
        
        if (error) throw error
        return data
    }

    static async updateEvent(eventId, updates) {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', eventId)
            .select()
        
        if (error) throw error
        return data[0]
    }

    // Car operations
    static async createCar(car) {
        const { data, error } = await supabase
            .from('cars')
            .insert([car])
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async getCarsForEvent(eventId) {
        const { data, error } = await supabase
            .from('cars')
            .select(`
                *,
                passengers (*)
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })
        
        if (error) throw error
        return data
    }

    static async updateCar(carId, updates) {
        const { data, error } = await supabase
            .from('cars')
            .update(updates)
            .eq('id', carId)
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async deleteCar(carId) {
        const { error } = await supabase
            .from('cars')
            .delete()
            .eq('id', carId)
        
        if (error) throw error
    }

    // Passenger operations
    static async addPassenger(passenger) {
        const { data, error } = await supabase
            .from('passengers')
            .insert([passenger])
            .select()
        
        if (error) throw error
        return data[0]
    }

    static async removePassenger(passengerId) {
        const { error } = await supabase
            .from('passengers')
            .delete()
            .eq('id', passengerId)
        
        if (error) throw error
    }

    static async getPassengersForCar(carId) {
        const { data, error } = await supabase
            .from('passengers')
            .select('*')
            .eq('car_id', carId)
            .order('seat_index', { ascending: true })
        
        if (error) throw error
        return data
    }

    // Cleanup expired events (events past their date + time + 24 hours)
    static async cleanupExpiredEvents() {
        const { data, error } = await supabase
            .rpc('cleanup_expired_events_simple')
        
        if (error) throw error
        return data
    }

    // Get all events (for cleanup purposes)
    static async getAllEvents() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })
        
        if (error) throw error
        return data
    }
}
