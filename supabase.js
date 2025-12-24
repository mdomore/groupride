// Database configuration
// Uses local Supabase instance via Kong Gateway

import { createClient } from '@supabase/supabase-js'

// Determine base URL - Supabase client expects origin only, we'll handle path in custom fetch
function getSupabaseUrl() {
    if (import.meta.env.VITE_SUPABASE_URL) {
        return import.meta.env.VITE_SUPABASE_URL
    }
    return window.location.origin
}

const supabaseUrl = getSupabaseUrl()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required')
}

// Custom fetch function to add /groupride prefix to API paths and ensure apikey header
const customFetch = (url, options = {}) => {
    const pathname = window.location.pathname
    let modifiedUrl = url
    
    // If app is served from /groupride, add prefix to API paths
    if (pathname.startsWith('/groupride')) {
        const urlObj = new URL(url)
        // Only modify /rest/v1/, /auth/v1/, /realtime/v1/ paths
        if (urlObj.pathname.startsWith('/rest/v1/') || 
            urlObj.pathname.startsWith('/auth/v1/') || 
            urlObj.pathname.startsWith('/realtime/v1/')) {
            urlObj.pathname = `/groupride${urlObj.pathname}`
            modifiedUrl = urlObj.toString()
        }
    }
    
    // Ensure apikey header is always present
    // Convert headers to plain object if needed, then ensure apikey is set
    let headersObj = {}
    if (options.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                headersObj[key] = value
            })
        } else if (options.headers instanceof Object) {
            headersObj = { ...options.headers }
        }
    }
    
    // Always set apikey header
    headersObj['apikey'] = supabaseKey
    
    return fetch(modifiedUrl, {
        ...options,
        headers: headersObj
    })
}

// Create client with custom fetch to handle path prefix and ensure apikey header
export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: customFetch,
        headers: {
            apikey: supabaseKey
        }
    }
})

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
            .maybeSingle()
        
        if (error) throw error
        if (!data) throw new Error('Event not found')
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

    static async deleteEvent(eventId) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)
        
        if (error) throw error
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
                id,
                event_id,
                driver_name,
                driver_phone,
                driver_email,
                car_model,
                available_seats,
                occupied_seats,
                requires_pin,
                pickup_address,
                dropoff_address,
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

    // Ride request operations
    static async createRideRequest(request) {
        const { data, error } = await supabase
            .from('ride_requests')
            .insert([request])
            .select()

        if (error) throw error
        return data[0]
    }

    static async createRideRequestPassengers(passengers) {
        if (!passengers || passengers.length === 0) return []

        const { data, error } = await supabase
            .from('ride_request_passengers')
            .insert(passengers)
            .select()

        if (error) throw error
        return data
    }

    static async getRideRequestsForEvent(eventId) {
        const { data, error } = await supabase
            .from('ride_requests')
            .select(`
                *,
                ride_request_passengers (* )
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })
            .order('created_at', { ascending: true, foreignTable: 'ride_request_passengers' })

        if (error) throw error
        return data
    }

    static async deleteRideRequest(requestId) {
        // First, find all passengers assigned to cars from this ride request
        // and free up their seats before deleting the ride request
        
        // Get all ride request passengers for this request
        const { data: ridePassengers, error: ridePassengersError } = await supabase
            .from('ride_request_passengers')
            .select('id')
            .eq('request_id', requestId)

        if (ridePassengersError) throw ridePassengersError

        if (ridePassengers && ridePassengers.length > 0) {
            const ridePassengerIds = ridePassengers.map(rp => rp.id)

            // Find all passengers in cars that are linked to these ride request passengers
            const { data: passengers, error: passengersError } = await supabase
                .from('passengers')
                .select('id, car_id, request_passenger_id')
                .in('request_passenger_id', ridePassengerIds)

            if (passengersError) throw passengersError

            // Group passengers by car_id to update occupied_seats efficiently
            const carPassengerCounts = {}
            for (const passenger of passengers || []) {
                if (passenger.car_id) {
                    carPassengerCounts[passenger.car_id] = (carPassengerCounts[passenger.car_id] || 0) + 1
                }
            }

            // Remove all passengers linked to this ride request
            if (passengers && passengers.length > 0) {
                const passengerIds = passengers.map(p => p.id)
                const { error: deletePassengersError } = await supabase
                    .from('passengers')
                    .delete()
                    .in('id', passengerIds)

                if (deletePassengersError) throw deletePassengersError
            }

            // Update occupied_seats for each affected car
            for (const [carId, count] of Object.entries(carPassengerCounts)) {
                // Get current car state
                const { data: car, error: carError } = await supabase
                    .from('cars')
                    .select('occupied_seats')
                    .eq('id', carId)
                    .single()

                if (carError) throw carError

                // Update occupied_seats
                const { error: updateError } = await supabase
                    .from('cars')
                    .update({ occupied_seats: Math.max(0, (car.occupied_seats || 0) - count) })
                    .eq('id', carId)

                if (updateError) throw updateError
            }
        }

        // Now delete the ride request (this will cascade delete ride_request_passengers)
        const { error } = await supabase
            .from('ride_requests')
            .delete()
            .eq('id', requestId)

        if (error) throw error
    }

    static async deleteRidePassenger(passengerId) {
        const { error } = await supabase
            .from('ride_request_passengers')
            .delete()
            .eq('id', passengerId)

        if (error) throw error
    }

    static async markRidePassengerAssigned(passengerId, carId) {
        const { data, error } = await supabase
            .from('ride_request_passengers')
            .update({ status: 'assigned', assigned_car_id: carId })
            .eq('id', passengerId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    static async markRidePassengerWaiting(passengerId) {
        const { data, error } = await supabase
            .from('ride_request_passengers')
            .update({ status: 'waiting', assigned_car_id: null })
            .eq('id', passengerId)
            .select()
            .single()

        if (error) throw error
        return data
    }

    static async resetRidePassengersForCar(carId) {
        const { error } = await supabase
            .from('ride_request_passengers')
            .update({ status: 'waiting', assigned_car_id: null })
            .eq('assigned_car_id', carId)

        if (error) throw error
    }

    static async verifyCarPin(carId, pin) {
        if (!pin) return false

        const { data, error } = await supabase
            .from('cars')
            .select('id')
            .eq('id', carId)
            .eq('car_pin', pin)
            .maybeSingle()

        if (error || !data) {
            return false
        }

        return true
    }

    // Event password verification
    static async verifyEventPassword(eventId, password) {
        if (!password) return false

        // Get the event to check if it has a password
        const event = await this.getEvent(eventId)
        if (!event || !event.password_hash) {
            return false
        }

        // Hash the provided password and compare
        const passwordHash = await this.hashPassword(password)
        return passwordHash === event.password_hash
    }

    // Simple password hashing (using Web Crypto API)
    static async hashPassword(password) {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        return hashHex
    }
}
