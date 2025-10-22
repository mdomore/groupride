// Import Supabase client and database service
import { supabase, DatabaseService } from './supabase.js'

// Simple data storage using Supabase
class GroupRideApp {
    constructor() {
        this.currentEventId = null;
        this.initializeEventListeners();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Event creation form
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createEvent();
        });

        // Car registration form
        document.getElementById('car-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registerCar();
        });

        // Join event form
        document.getElementById('join-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinEvent();
        });

        // Edit event form
        document.getElementById('edit-event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.editEvent();
        });


        // Back to create event button
        document.getElementById('back-to-create').addEventListener('click', () => {
            this.resetToCreateEvent();
        });

        // Copy current event ID button
        document.getElementById('copy-current-event-id').addEventListener('click', () => {
            this.copyCurrentEventId();
        });

        // Cancel add car button
        document.getElementById('cancel-add-car').addEventListener('click', () => {
            this.cancelAddCar();
        });

        // Edit event button
        document.getElementById('edit-event-btn').addEventListener('click', () => {
            this.showEditEventForm();
        });

        // Cancel edit event button
        document.getElementById('cancel-edit-event').addEventListener('click', () => {
            this.cancelEditEvent();
        });

        // Modal event listeners
        document.getElementById('confirm-booking').addEventListener('click', () => {
            this.confirmBooking();
        });

        document.getElementById('cancel-booking').addEventListener('click', () => {
            this.hidePassengerModal();
        });

        document.getElementById('confirm-yes').addEventListener('click', () => {
            this.confirmAction();
        });

        document.getElementById('confirm-no').addEventListener('click', () => {
            this.hideConfirmModal();
        });

        // Close modals when clicking outside
        document.getElementById('passenger-modal').addEventListener('click', (e) => {
            if (e.target.id === 'passenger-modal') {
                this.hidePassengerModal();
            }
        });

        document.getElementById('confirm-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirm-modal') {
                this.hideConfirmModal();
            }
        });

        // Enter key for passenger name input
        document.getElementById('passenger-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmBooking();
            }
        });
    }

    // Generate a simple event ID
    generateEventId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    }

    // Create a new event
    async createEvent() {
        const eventName = document.getElementById('event-name').value.trim();
        const eventDescription = document.getElementById('event-description').value.trim();
        const eventDate = document.getElementById('event-date').value;
        const eventTime = document.getElementById('event-time').value;

        // Validate inputs
        if (!eventName) {
            this.showFieldError('event-name', 'Event name is required');
            return;
        }

        if (!eventDate) {
            this.showFieldError('event-date', 'Event date is required');
            return;
        }

        if (!eventTime) {
            this.showFieldError('event-time', 'Event time is required');
            return;
        }

        // Check if date is in the past
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        if (eventDateTime < new Date()) {
            this.showFieldError('event-date', 'Event date cannot be in the past');
            return;
        }

        // Clear any previous errors
        this.clearFieldErrors();

        try {
            // Generate unique event ID
            let eventId;
            let exists = true;
            while (exists) {
                eventId = this.generateEventId();
                try {
                    await DatabaseService.getEvent(eventId);
                    exists = true; // Event exists, try again
                } catch (error) {
                    exists = false; // Event doesn't exist, we can use this ID
                }
            }

            // Create event object
            const event = {
                id: eventId,
                name: eventName,
                description: eventDescription,
                date: eventDate,
                time: eventTime
            };

            // Save event to database
            await DatabaseService.createEvent(event);

            // Show event details
            this.showEventDetails(eventId);
            this.showMessage('Event created successfully!', 'success');
        } catch (error) {
            console.error('Error creating event:', error);
            this.showMessage('Failed to create event. Please try again.', 'error');
        }
    }

    // Show event details after creation
    showEventDetails(eventId) {
        this.currentEventId = eventId;
        
        // Go directly to event view
        this.displayEventView();
    }

    // Register a car for the current event
    async registerCar() {
        if (!this.currentEventId) {
            this.showMessage('Please create or join an event first!', 'error');
            return;
        }

        const driverName = document.getElementById('driver-name').value.trim();
        const driverPhone = document.getElementById('driver-phone').value.trim();
        const driverEmail = document.getElementById('driver-email').value.trim();
        const carModel = document.getElementById('car-model').value.trim();
        const availableSeats = parseInt(document.getElementById('available-seats').value);

        // Validate inputs
        if (!driverName) {
            this.showFieldError('driver-name', 'Driver name is required');
            return;
        }

        if (!carModel) {
            this.showFieldError('car-model', 'Car model is required');
            return;
        }

        if (!availableSeats || availableSeats < 1 || availableSeats > 8) {
            this.showFieldError('available-seats', 'Please enter 1-8 seats');
            return;
        }

        // Clear any previous errors
        this.clearFieldErrors();

        try {
            const car = {
                event_id: this.currentEventId,
                driver_name: driverName,
                driver_phone: driverPhone,
                driver_email: driverEmail,
                car_model: carModel,
                available_seats: availableSeats,
                occupied_seats: 0
            };

            // Add car to database
            await DatabaseService.createCar(car);

            // Clear form
            document.getElementById('car-form').reset();

            // Hide car registration and show event view
            document.getElementById('car-registration').classList.add('hidden');
            this.displayEventView();
            this.showMessage('Car registered successfully!', 'success');
        } catch (error) {
            console.error('Error registering car:', error);
            this.showMessage('Failed to register car. Please try again.', 'error');
        }
    }

    // Join an existing event
    async joinEvent() {
        const input = document.getElementById('join-event-id').value.trim();
        
        // Extract event ID from input (handles both event ID and full URL)
        const eventId = this.extractEventId(input);
        
        if (!eventId) {
            this.showMessage('Invalid event ID or URL format.', 'error');
            return;
        }

        try {
            await DatabaseService.getEvent(eventId);
            this.currentEventId = eventId;
            this.displayEventView();
        } catch (error) {
            this.showMessage('Event not found. Please check the Event ID or URL.', 'error');
        }
    }

    // Extract event ID from input (handles both event ID and full URL)
    extractEventId(input) {
        if (!input) return null;
        
        // If it's already just an event ID (8 characters, alphanumeric)
        if (/^[A-Z0-9]{8}$/.test(input.toUpperCase())) {
            return input.toUpperCase();
        }
        
        // If it's a URL, try to extract the event ID from query parameters
        try {
            const url = new URL(input);
            const eventParam = url.searchParams.get('event');
            if (eventParam && /^[A-Z0-9]{8}$/.test(eventParam.toUpperCase())) {
                return eventParam.toUpperCase();
            }
        } catch (e) {
            // If URL parsing fails, try to extract from the path or just the input
            const match = input.match(/[A-Z0-9]{8}/i);
            if (match) {
                return match[0].toUpperCase();
            }
        }
        
        return null;
    }

    // Show edit event form with current event data
    async showEditEventForm() {
        if (!this.currentEventId) {
            this.showMessage('No event to edit!', 'error');
            return;
        }

        try {
            // Get current event data
            const event = await DatabaseService.getEvent(this.currentEventId);
            
            // Pre-fill the form with current event data
            document.getElementById('edit-event-name').value = event.name;
            document.getElementById('edit-event-description').value = event.description || '';
            document.getElementById('edit-event-date').value = event.date;
            document.getElementById('edit-event-time').value = event.time;
            
            // Hide event view and show edit form
            document.getElementById('event-view').classList.add('hidden');
            document.getElementById('edit-event').classList.remove('hidden');
            
            // Focus on the first input
            setTimeout(() => {
                document.getElementById('edit-event-name').focus();
            }, 100);
        } catch (error) {
            console.error('Error loading event for editing:', error);
            this.showMessage('Failed to load event for editing. Please try again.', 'error');
        }
    }

    // Handle edit event form submission
    async editEvent() {
        if (!this.currentEventId) {
            this.showMessage('No event to edit!', 'error');
            return;
        }

        const eventName = document.getElementById('edit-event-name').value.trim();
        const eventDescription = document.getElementById('edit-event-description').value.trim();
        const eventDate = document.getElementById('edit-event-date').value;
        const eventTime = document.getElementById('edit-event-time').value;

        // Validate inputs (same validation as create event)
        if (!eventName) {
            this.showFieldError('edit-event-name', 'Event name is required');
            return;
        }

        if (!eventDate) {
            this.showFieldError('edit-event-date', 'Event date is required');
            return;
        }

        if (!eventTime) {
            this.showFieldError('edit-event-time', 'Event time is required');
            return;
        }

        // Check if date is in the past
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        if (eventDateTime < new Date()) {
            this.showFieldError('edit-event-date', 'Event date cannot be in the past');
            return;
        }

        // Clear any previous errors
        this.clearFieldErrors();

        try {
            // Update event in database
            const updates = {
                name: eventName,
                description: eventDescription,
                date: eventDate,
                time: eventTime
            };

            await DatabaseService.updateEvent(this.currentEventId, updates);

            // Return to event view and refresh
            this.cancelEditEvent();
            await this.displayEventView();
            this.showMessage('Event updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating event:', error);
            this.showMessage('Failed to update event. Please try again.', 'error');
        }
    }

    // Cancel edit event and return to event view
    cancelEditEvent() {
        // Clear form
        document.getElementById('edit-event-form').reset();
        this.clearFieldErrors();
        
        // Hide edit form and show event view
        document.getElementById('edit-event').classList.add('hidden');
        document.getElementById('event-view').classList.remove('hidden');
    }

    // Display the event view with cars and booking options
    async displayEventView() {
        if (!this.currentEventId) return;

        try {
            // First, run cleanup to remove expired events
            await this.cleanupExpiredEvents();
            
            const event = await DatabaseService.getEvent(this.currentEventId);
            document.getElementById('current-event-name').textContent = event.name;
            const descElement = document.getElementById('current-event-description');
            if (event.description) {
                descElement.textContent = event.description;
                descElement.classList.remove('hidden');
            } else {
                descElement.classList.add('hidden');
            }
            document.getElementById('current-event-id').textContent = this.currentEventId;
            
            // Format and display date and time
            const formattedDate = this.formatDate(event.date);
            const formattedTime = this.formatTime(event.time);
            document.getElementById('current-event-date').textContent = formattedDate;
            document.getElementById('current-event-time').textContent = formattedTime;
            
            // Update URL with event ID for sharing
            this.updateURL(this.currentEventId);
            
            // Show event view section and hide creation sections
            document.getElementById('event-view').classList.remove('hidden');
            document.getElementById('join-event').classList.add('hidden');
            document.getElementById('create-event').classList.add('hidden');

            // Display cars
            await this.displayCars();
        } catch (error) {
            console.error('Error loading event:', error);
            this.showMessage('Failed to load event. Please try again.', 'error');
        }
    }

    // Display all cars for the current event
    async displayCars() {
        try {
            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            const carsList = document.getElementById('cars-list');
            
            if (cars.length === 0) {
                carsList.innerHTML = `
                    <div class="cars-summary">
                        <h3>No cars registered yet</h3>
                        <p>Be the first to register your car!</p>
                        <button onclick="window.app.showAddCarForm()" class="add-car-btn">
                            Register First Car
                        </button>
                    </div>
                `;
                return;
            }

            const totalSeats = cars.reduce((sum, car) => sum + car.available_seats, 0);
            const occupiedSeats = cars.reduce((sum, car) => sum + car.occupied_seats, 0);
            const availableSeats = totalSeats - occupiedSeats;

            carsList.innerHTML = `
                <div class="cars-summary">
                    <h3>Available Cars (${cars.length})</h3>
                    <p class="summary-stats">
                        <span class="stat">${totalSeats} total seats</span>
                        <span class="stat">${occupiedSeats} occupied</span>
                        <span class="stat highlight">${availableSeats} available</span>
                    </p>
                    <button onclick="window.app.showAddCarForm()" class="add-car-btn">
                        Add Car
                    </button>
                </div>
                ${cars.map((car, index) => `
                    <div class="car-item">
                        <div class="car-header">
                            <h4>Car #${index + 1}: ${car.car_model}</h4>
                            <div class="car-actions">
                            <span class="driver-badge">${car.driver_name}</span>
                            ${(car.driver_phone || car.driver_email) ? `
                                <div class="driver-contact">
                                    ${car.driver_phone ? `<span>${car.driver_phone}</span>` : ''}
                                    ${car.driver_email ? `<span>${car.driver_email}</span>` : ''}
                                </div>
                            ` : ''}
                            <button onclick="window.app.removeCar(${car.id})" class="remove-car-btn" title="Remove this car">
                                Remove
                            </button>
                            </div>
                        </div>
                        
                        <div class="car-layout">
                            <div class="seats-container">
                                ${this.generateSeats(car)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error loading cars:', error);
            this.showMessage('Failed to load cars. Please try again.', 'error');
        }
    }

    // Generate seat layout
    generateSeats(car) {
        const totalSeats = car.available_seats;
        const passengers = car.passengers || [];
        
        let seatsHTML = '';
        
        for (let i = 0; i < totalSeats; i++) {
            const passenger = passengers.find(p => p.seat_index === i);
            const isOccupied = !!passenger;
            const passengerName = passenger ? passenger.name : '';
            const seatClass = isOccupied ? 'seat-box occupied' : 'seat-box available';
            
            seatsHTML += `
                <div class="${seatClass}" onclick="${isOccupied ? `window.app.freeSeat(${car.id}, ${i})` : `window.app.bookSeat(${car.id})`}" title="${isOccupied ? `Free seat for ${passengerName}` : 'Book this seat'}">
                    <div class="seat-content">
                        <div class="seat-number">${i + 1}</div>
                        ${isOccupied ? `<div class="passenger-name">${passengerName}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        return seatsHTML;
    }

    // Book a seat in a specific car
    bookSeat(carId) {
        this.currentBookingCarId = carId;
        document.getElementById('passenger-name-input').value = '';
        document.getElementById('passenger-modal').classList.remove('hidden');
        document.getElementById('passenger-name-input').focus();
    }

    // Confirm booking from modal
    async confirmBooking() {
        const passengerName = document.getElementById('passenger-name-input').value.trim();
        if (!passengerName) {
            this.showMessage('Please enter a valid name', 'error');
            return;
        }

        try {
            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            const car = cars.find(c => c.id === this.currentBookingCarId);

            if (car && car.available_seats > car.occupied_seats) {
                // Add passenger to database
                await DatabaseService.addPassenger({
                    car_id: this.currentBookingCarId,
                    name: passengerName,
                    seat_index: car.occupied_seats
                });

                // Update car occupied seats
                await DatabaseService.updateCar(this.currentBookingCarId, {
                    occupied_seats: car.occupied_seats + 1
                });

                // Refresh display
                await this.displayCars();
                this.showMessage(`Seat booked for ${passengerName}!`, 'success');
                this.hidePassengerModal();
            } else {
                this.showMessage('No seats available in this car.', 'error');
                this.hidePassengerModal();
            }
        } catch (error) {
            console.error('Error booking seat:', error);
            this.showMessage('Failed to book seat. Please try again.', 'error');
        }
    }

    // Free a seat in a specific car
    async freeSeat(carId, seatIndex) {
        try {
            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            const car = cars.find(c => c.id === carId);
            const passenger = car.passengers.find(p => p.seat_index === seatIndex);
            
            if (passenger) {
                // Store the action details for confirmation
                this.pendingAction = {
                    type: 'freeSeat',
                    carId: carId,
                    seatIndex: seatIndex,
                    passengerId: passenger.id,
                    passengerName: passenger.name
                };
                
                // Show confirmation modal
                document.getElementById('confirm-title').textContent = 'Free Seat';
                document.getElementById('confirm-message').textContent = `Are you sure you want to free the seat for ${passenger.name}?`;
                document.getElementById('confirm-modal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error freeing seat:', error);
            this.showMessage('Failed to free seat. Please try again.', 'error');
        }
    }

    // Remove a car from the event
    async removeCar(carId) {
        try {
            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            const car = cars.find(c => c.id === carId);
            
            if (car) {
                const carInfo = `${car.car_model} (${car.driver_name})`;
                const hasPassengers = car.passengers && car.passengers.length > 0;
                
                // Store the action details for confirmation
                this.pendingAction = {
                    type: 'removeCar',
                    carId: carId,
                    carInfo: carInfo,
                    hasPassengers: hasPassengers
                };
                
                // Show confirmation modal
                document.getElementById('confirm-title').textContent = 'Remove Car';
                let message = `Are you sure you want to remove ${carInfo}?`;
                if (hasPassengers) {
                    message += `\n\nThis will also remove all ${car.passengers.length} passenger(s) from this car.`;
                }
                document.getElementById('confirm-message').textContent = message;
                document.getElementById('confirm-modal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error removing car:', error);
            this.showMessage('Failed to remove car. Please try again.', 'error');
        }
    }

    // Show field-specific error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form-group');
        
        // Remove existing error
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
        
        // Highlight field
        field.style.borderColor = '#e53e3e';
    }

    // Clear all field errors
    clearFieldErrors() {
        const errors = document.querySelectorAll('.field-error');
        errors.forEach(error => error.remove());
        
        // Reset field borders
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.style.borderColor = '#e2e8f0';
        });
    }

    // Reset to create event view
    resetToCreateEvent() {
        this.currentEventId = null;
        
        // Clear URL
        this.updateURL(null);
        
        // Hide all event-related sections
        document.getElementById('car-registration').classList.add('hidden');
        document.getElementById('event-view').classList.add('hidden');
        document.getElementById('edit-event').classList.add('hidden');
        
        // Show create event and join event sections
        document.getElementById('create-event').classList.remove('hidden');
        document.getElementById('join-event').classList.remove('hidden');
        
        // Restore original car registration title
        const carSection = document.getElementById('car-registration');
        const title = carSection.querySelector('h2');
        title.textContent = 'Register Your Car';
        
        // Clear forms
        document.getElementById('event-form').reset();
        document.getElementById('car-form').reset();
        document.getElementById('join-form').reset();
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-date').value = today;
        
        this.clearFieldErrors();
    }


    // Copy current event ID to clipboard
    copyCurrentEventId() {
        const eventId = this.currentEventId;
        const shareUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}`;
        
        // Check if modern clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showMessage('Event link copied to clipboard!', 'success');
            }).catch(() => {
                // If modern API fails, use fallback
                this.fallbackCopyToClipboard(shareUrl);
            });
        } else {
            // Use fallback for older browsers or non-HTTPS
            this.fallbackCopyToClipboard(shareUrl);
        }
    }

    // Fallback method for copying to clipboard
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showMessage('Event link copied to clipboard!', 'success');
        } catch (err) {
            this.showMessage('Failed to copy link. Please copy manually: ' + text, 'error');
        }
        
        document.body.removeChild(textArea);
    }

    // Update URL with event ID for sharing
    updateURL(eventId) {
        const url = new URL(window.location);
        
        if (eventId) {
            url.searchParams.set('event', eventId);
        } else {
            url.searchParams.delete('event');
        }
        
        // Update URL without page reload
        window.history.pushState({}, '', url);
    }

    // Show add car form
    showAddCarForm() {
        console.log('showAddCarForm called'); // Debug log
        console.log('currentEventId:', this.currentEventId); // Debug log
        
        // Update the section title to indicate we're adding another car
        const carSection = document.getElementById('car-registration');
        const title = carSection.querySelector('h2');
        title.textContent = 'Add Another Car';
        
        // Hide event view and show only car registration
        document.getElementById('event-view').classList.add('hidden');
        carSection.classList.remove('hidden');
        
        // Focus on the first input
        setTimeout(() => {
            document.getElementById('driver-name').focus();
        }, 100);
    }

    // Cancel adding a car and return to event view
    cancelAddCar() {
        // Clear the form
        document.getElementById('car-form').reset();
        this.clearFieldErrors();
        
        // Hide car registration and show event view
        document.getElementById('car-registration').classList.add('hidden');
        this.displayEventView();
    }

    // Show a message to the user
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.success, .error');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;

        // Insert at the top of the main content
        const main = document.querySelector('main');
        main.insertBefore(messageDiv, main.firstChild);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format time for display
    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Cleanup expired events (runs automatically)
    async cleanupExpiredEvents() {
        try {
            const result = await DatabaseService.cleanupExpiredEvents();
            if (result && result.length > 0 && result[0].deleted_count > 0) {
                console.log(`Cleaned up ${result[0].deleted_count} expired events`);
            }
        } catch (error) {
            console.error('Error cleaning up expired events:', error);
            // Don't show error to user as this is a background operation
        }
    }

    // Modal management methods
    hidePassengerModal() {
        document.getElementById('passenger-modal').classList.add('hidden');
        this.currentBookingCarId = null;
    }

    hideConfirmModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
        this.pendingAction = null;
    }

    async confirmAction() {
        if (!this.pendingAction) return;

        const { type, carId, seatIndex, passengerId, passengerName, carInfo, hasPassengers } = this.pendingAction;

        try {
            if (type === 'freeSeat') {
                // Remove passenger from database
                await DatabaseService.removePassenger(passengerId);
                
                // Update car occupied seats
                const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
                const car = cars.find(c => c.id === carId);
                await DatabaseService.updateCar(carId, {
                    occupied_seats: car.occupied_seats - 1
                });

                // Refresh display
                await this.displayCars();
                this.showMessage(`Seat freed for ${passengerName}`, 'success');
            } else if (type === 'removeCar') {
                // Remove car (passengers will be deleted automatically due to CASCADE)
                await DatabaseService.deleteCar(carId);
                
                // Refresh display
                await this.displayCars();
                
                if (hasPassengers) {
                    this.showMessage(`${carInfo} and all passengers removed`, 'success');
                } else {
                    this.showMessage(`${carInfo} removed`, 'success');
                }
            }

            this.hideConfirmModal();
        } catch (error) {
            console.error('Error confirming action:', error);
            this.showMessage('Failed to complete action. Please try again.', 'error');
        }
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new GroupRideApp();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('event-date').value = today;
    
    // Run cleanup on app startup
    await window.app.cleanupExpiredEvents();
    
    // Check if there's an event ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    if (eventId) {
        try {
            await DatabaseService.getEvent(eventId);
            window.app.currentEventId = eventId;
            await window.app.displayEventView();
        } catch (error) {
            console.error('Error loading event from URL:', error);
            // Event not found, continue with normal flow
        }
    }
});
