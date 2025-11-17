// Import Supabase client and database service
import { supabase, DatabaseService } from './supabase.js'

// Simple data storage using Supabase
class GroupRideApp {
    constructor() {
        this.currentEventId = null;
        this.currentCars = [];
        this.currentRideRequests = [];
        this.currentBookingCarId = null;
        this.currentBookingCarRequiresPin = false;
        this.currentBookingCarValidated = false;
        this.pendingAction = null;
        this.pinModalState = null;
        this.initializeEventListeners();
        this.resetRideRequestForm();
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

        document.getElementById('confirm-pin').addEventListener('click', () => {
            this.submitPinModal();
        });

        document.getElementById('cancel-pin').addEventListener('click', () => {
            this.cancelPinModal();
        });

        // Ride request form
        document.getElementById('ride-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createRideRequest();
        });

        document.getElementById('clear-ride-request').addEventListener('click', () => {
            this.resetRideRequestForm();
        });

        document.getElementById('add-passenger-input').addEventListener('click', () => {
            this.addPassengerInputField();
        });

        document.getElementById('car-requires-pin').addEventListener('change', (e) => {
            const pinGroup = document.getElementById('car-pin-group');
            if (e.target.checked) {
                pinGroup.classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('car-pin').focus();
                }, 50);
            } else {
                pinGroup.classList.add('hidden');
                document.getElementById('car-pin').value = '';
            }
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

        document.getElementById('pin-modal').addEventListener('click', (e) => {
            if (e.target.id === 'pin-modal') {
                this.cancelPinModal();
            }
        });

        // Enter key for passenger name input
        document.getElementById('passenger-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmBooking();
            }
        });

        document.getElementById('car-pin-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitPinModal();
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
        this.clearFormErrors('event-form');

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
        const pickupAddress = document.getElementById('car-pickup-address').value.trim();
        const dropoffAddress = document.getElementById('car-dropoff-address').value.trim();
        const requiresPin = document.getElementById('car-requires-pin').checked;
        const carPin = document.getElementById('car-pin').value.trim();

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

        if (requiresPin && carPin.length < 4) {
            this.showFieldError('car-pin', 'PIN must be at least 4 characters');
            return;
        }

        // Clear any previous errors
        this.clearFormErrors('car-form');

        try {
            const car = {
                event_id: this.currentEventId,
                driver_name: driverName,
                driver_phone: driverPhone || null,
                driver_email: driverEmail || null,
                car_model: carModel,
                available_seats: availableSeats,
                occupied_seats: 0,
                pickup_address: pickupAddress || null,
                dropoff_address: dropoffAddress || null,
                requires_pin: requiresPin,
                car_pin: requiresPin ? carPin : null
            };

            // Add car to database
            await DatabaseService.createCar(car);

            // Clear form
            document.getElementById('car-form').reset();
            document.getElementById('car-pin-group').classList.add('hidden');

            // Hide car registration and show event view
            document.getElementById('car-registration').classList.add('hidden');
            this.displayEventView();
            this.showMessage('Car registered successfully!', 'success');
        } catch (error) {
            console.error('Error registering car:', error);
            this.showMessage('Failed to register car. Please try again.', 'error');
        }
    }

    // Create a ride request for the current event
    async createRideRequest() {
        if (!this.currentEventId) {
            this.showMessage('Join or create an event before asking for a ride.', 'error');
            return;
        }

        const contactName = document.getElementById('ride-request-contact-name').value.trim();
        const contactPhone = document.getElementById('ride-request-contact-phone').value.trim();
        const pickupAddress = document.getElementById('ride-request-pickup-address').value.trim();
        const dropoffAddress = document.getElementById('ride-request-dropoff-address').value.trim();
        const notes = document.getElementById('ride-request-notes').value.trim();
        const passengerNames = this.getPassengerInputValues();

        if (!contactName) {
            this.showFieldError('ride-request-contact-name', 'Contact name is required.');
            return;
        }

        if (passengerNames.length === 0) {
            this.showMessage('Add at least one rider name before submitting.', 'error');
            return;
        }

        if (!passengerNames.some(name => name.toLowerCase() === contactName.toLowerCase())) {
            passengerNames.unshift(contactName);
        }

        this.clearFormErrors('ride-request-form');

        try {
            const request = await DatabaseService.createRideRequest({
                event_id: this.currentEventId,
                contact_name: contactName,
                contact_phone: contactPhone || null,
                pickup_address: pickupAddress || null,
                dropoff_address: dropoffAddress || null,
                notes: notes || null
            });

            await DatabaseService.createRideRequestPassengers(
                passengerNames.map(name => ({
                    request_id: request.id,
                    name,
                    status: 'waiting'
                }))
            );

            this.resetRideRequestForm();
            await this.displayRideRequests();
            this.showMessage('Ride request posted!', 'success');
        } catch (error) {
            console.error('Error creating ride request:', error);
            this.showMessage('Failed to post ride request. Please try again.', 'error');
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
        
        // Clean input - remove any colon and characters after it (e.g., "ASN9UH7K:1" -> "ASN9UH7K")
        const cleaned = input.split(':')[0].trim().toUpperCase();
        
        // If it's already just an event ID (8 characters, alphanumeric)
        if (/^[A-Z0-9]{8}$/.test(cleaned)) {
            return cleaned;
        }
        
        // If it's a URL, try to extract the event ID from query parameters
        try {
            const url = new URL(input);
            const eventParam = url.searchParams.get('event');
            if (eventParam) {
                const cleanedParam = eventParam.split(':')[0].trim().toUpperCase();
                if (/^[A-Z0-9]{8}$/.test(cleanedParam)) {
                    return cleanedParam;
                }
            }
        } catch (e) {
            // If URL parsing fails, try to extract from the path or just the input
            const match = cleaned.match(/[A-Z0-9]{8}/);
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
            document.getElementById('ride-requests-section').classList.remove('hidden');

            this.currentCars = [];

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

            this.currentCars = cars;
            await this.displayRideRequests();
            
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
                            <span class="car-pin-badge ${car.requires_pin ? 'protected' : 'open'}">${car.requires_pin ? 'PIN required' : 'Open seats'}</span>
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
                        ${(car.pickup_address || car.dropoff_address) ? `
                            <div class="car-addresses">
                                ${car.pickup_address ? `
                                    <div class="car-address">
                                        <strong>Pickup:</strong> ${this.escapeHtml(car.pickup_address)} 
                                        <a href="${this.getMapLink(car.pickup_address)}" target="_blank" class="map-link" title="Open in map app">${this.getMapArrowIcon()}</a>
                                    </div>
                                ` : ''}
                                ${car.dropoff_address ? `
                                    <div class="car-address">
                                        <strong>Drop-off:</strong> ${this.escapeHtml(car.dropoff_address)}
                                        <a href="${this.getMapLink(car.dropoff_address)}" target="_blank" class="map-link" title="Open in map app">${this.getMapArrowIcon()}</a>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        
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

    // Reset ride request form inputs
    resetRideRequestForm() {
        const form = document.getElementById('ride-request-form');
        if (form) {
            form.reset();
        }
        this.clearFormErrors('ride-request-form');
        const list = document.getElementById('ride-passenger-list');
        if (list) {
            list.innerHTML = '';
            this.addPassengerInputField();
        }
    }

    addPassengerInputField(value = '') {
        const list = document.getElementById('ride-passenger-list');
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'passenger-input-row';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Passenger name';
        input.value = value;
        input.setAttribute('data-role', 'ride-passenger-input');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-passenger-btn secondary-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            if (list.children.length > 1) {
                row.remove();
            } else {
                input.value = '';
                input.focus();
            }
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        list.appendChild(row);

        input.focus();
    }

    getPassengerInputValues() {
        const inputs = document.querySelectorAll('#ride-passenger-list [data-role="ride-passenger-input"]');
        const names = [];
        inputs.forEach((input) => {
            const value = input.value.trim();
            if (value) {
                names.push(value);
            }
        });
        return names;
    }

    // Display ride requests for the current event
    async displayRideRequests() {
        if (!this.currentEventId) return;

        try {
            const requests = await DatabaseService.getRideRequestsForEvent(this.currentEventId);
            this.currentRideRequests = requests;

            const list = document.getElementById('ride-requests-list');
            if (!list) return;

            const waitingCount = requests.reduce((count, request) => {
                const riders = request.ride_request_passengers || [];
                return count + riders.filter(r => r.status === 'waiting').length;
            }, 0);

            const countElement = document.getElementById('ride-requests-count');
            if (countElement) {
                countElement.textContent = waitingCount === 0
                    ? 'No riders waiting'
                    : `${waitingCount} rider${waitingCount === 1 ? '' : 's'} waiting`;
            }

            if (requests.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <p>No ride requests yet.</p>
                    </div>
                `;
                return;
            }

            const sortedRequests = [...requests].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            list.innerHTML = sortedRequests.map(request => this.renderRideRequestItem(request)).join('');
        } catch (error) {
            console.error('Error loading ride requests:', error);
            this.showMessage('Failed to load ride requests. Please try again.', 'error');
        }
    }

    renderRideRequestItem(request) {
        const metaLines = [];
        if (request.contact_phone) {
            metaLines.push(`Phone: ${this.escapeHtml(request.contact_phone)}`);
        }
        if (request.pickup_address) {
            const mapLink = this.getMapLink(request.pickup_address);
            metaLines.push(`Pickup: ${this.escapeHtml(request.pickup_address)} <a href="${mapLink}" target="_blank" class="map-link" title="Open in map app">${this.getMapArrowIcon()}</a>`);
        }
        if (request.dropoff_address) {
            metaLines.push(`Drop-off: ${this.escapeHtml(request.dropoff_address)}`);
        }
        if (request.notes) {
            metaLines.push(`Notes: ${this.escapeHtml(request.notes)}`);
        }

        const metaHtml = metaLines.length > 0
            ? `<div class="ride-request-meta">${metaLines.map(line => `<span>${line}</span>`).join('')}</div>`
            : '';

        const passengers = [...(request.ride_request_passengers || [])]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const availableCars = this.currentCars.filter(car => car.available_seats > car.occupied_seats);

        const passengersHtml = passengers.length === 0
            ? `<div class="empty-state"><p>No riders listed yet.</p></div>`
            : passengers.map(passenger => this.renderRideRequestPassenger(request, passenger, availableCars)).join('');

        return `
            <div class="ride-request-item">
                <div class="ride-request-main">
                    <h4>${request.contact_name}</h4>
                    ${metaHtml}
                </div>
                <div class="ride-request-passengers-list">
                    ${passengersHtml}
                </div>
                <div class="ride-request-actions">
                    <button class="secondary-btn" onclick="window.app.removeRideRequest(${request.id})">Remove Request</button>
                </div>
            </div>
        `;
    }

    renderRideRequestPassenger(request, passenger, availableCars) {
        const statusClass = passenger.status === 'waiting' ? 'waiting' : 'assigned';
        let controlsHtml = '';

        if (passenger.status === 'waiting') {
            if (availableCars.length > 0) {
                const options = availableCars.map(car => {
                    const seatsLeft = car.available_seats - car.occupied_seats;
                    const pinLabel = car.requires_pin ? ' (PIN)' : '';
                    return `<option value="${car.id}">${car.car_model} (${car.driver_name}) • ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'}${pinLabel}</option>`;
                }).join('');

                controlsHtml = `
                    <div class="assign-controls">
                        <select id="assign-select-${passenger.id}" class="assign-select">
                            <option value="">Select a car</option>
                            ${options}
                        </select>
                        <button type="button" class="secondary-btn" onclick="window.app.assignPassengerToSelectedCar(${passenger.id})">Assign</button>
                        <button type="button" class="remove-passenger-btn" onclick="window.app.removeRidePassenger(${passenger.id})">Remove</button>
                    </div>
                `;
            } else {
                controlsHtml = `
                    <div class="assign-controls no-cars">
                        <div class="ride-request-meta">No cars with free seats yet.</div>
                        <button type="button" class="remove-passenger-btn" onclick="window.app.removeRidePassenger(${passenger.id})">Remove</button>
                    </div>
                `;
            }
        } else {
            const assignedCar = this.currentCars.find(car => car.id === passenger.assigned_car_id);
            controlsHtml = `
                <div class="ride-request-meta">
                    <span>Assigned to ${assignedCar ? `${assignedCar.car_model} (${assignedCar.driver_name})` : 'a car'}.</span>
                </div>
            `;
        }

        return `
            <div class="ride-request-passenger ${statusClass}">
                <header>
                    <h4>${passenger.name}</h4>
                    <span class="status-tag ${statusClass}">${passenger.status === 'waiting' ? 'Waiting' : 'Assigned'}</span>
                </header>
                ${controlsHtml}
            </div>
        `;
    }

    // Remove a ride request after confirmation
    removeRideRequest(requestId) {
        const request = this.currentRideRequests.find(r => r.id === requestId);
        if (!request) return;

        this.pendingAction = {
            type: 'removeRideRequest',
            requestId,
            riderName: request.contact_name
        };

        document.getElementById('confirm-title').textContent = 'Remove Ride Request';
        document.getElementById('confirm-message').textContent = `Remove the ride request from ${request.contact_name}?`;
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    removeRidePassenger(passengerId) {
        const found = this.findRideRequestPassenger(passengerId);
        if (!found) return;

        const { passenger, request } = found;

        this.pendingAction = {
            type: 'removeRidePassenger',
            passengerId,
            passengerName: passenger.name,
            requestId: request.id,
            riderName: request.contact_name
        };

        document.getElementById('confirm-title').textContent = 'Remove Rider';
        document.getElementById('confirm-message').textContent = `Remove ${passenger.name} from ${request.contact_name}'s waitlist?`;
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    async assignPassengerToSelectedCar(passengerId) {
        const select = document.getElementById(`assign-select-${passengerId}`);
        if (!select) {
            this.showMessage('Select a car before assigning.', 'error');
            return;
        }

        const carId = parseInt(select.value, 10);
        if (!carId) {
            this.showMessage('Choose a car before assigning.', 'error');
            return;
        }

        await this.assignPassengerToCar(passengerId, carId);
    }

    async assignPassengerToCar(passengerId, carId) {
        try {
            const found = this.findRideRequestPassenger(passengerId);
            if (!found) {
                this.showMessage('Rider not found.', 'error');
                return;
            }

            const { passenger } = found;

            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            this.currentCars = cars;
            const car = cars.find(c => c.id === carId);

            if (!car) {
                this.showMessage('Car not found.', 'error');
                return;
            }

            if (car.available_seats <= car.occupied_seats) {
                this.showMessage('No seats available in that car.', 'error');
                return;
            }

            const pinOk = await this.ensureCarPin(car, 'Enter the PIN before assigning riders to this car.');
            if (!pinOk) {
                return;
            }

            const seatIndex = this.getNextAvailableSeatIndex(car);
            if (seatIndex === null) {
                this.showMessage('No seats available in that car.', 'error');
                return;
            }

            await DatabaseService.addPassenger({
                car_id: carId,
                name: passenger.name,
                seat_index: seatIndex,
                request_passenger_id: passenger.id
            });

            await DatabaseService.updateCar(carId, {
                occupied_seats: car.occupied_seats + 1
            });

            await DatabaseService.markRidePassengerAssigned(passenger.id, carId);

            await this.displayCars();
            this.showMessage(`${passenger.name} assigned to ${car.car_model}.`, 'success');
        } catch (error) {
            console.error('Error assigning passenger:', error);
            this.showMessage('Failed to assign rider. Please try again.', 'error');
        }
    }

    findRideRequestPassenger(passengerId) {
        for (const request of this.currentRideRequests || []) {
            const passengers = request.ride_request_passengers || [];
            const passenger = passengers.find(p => p.id === passengerId);
            if (passenger) {
                return { request, passenger };
            }
        }
        return null;
    }

    getNextAvailableSeatIndex(car) {
        const taken = (car.passengers || []).map(p => p.seat_index);
        for (let i = 0; i < car.available_seats; i++) {
            if (!taken.includes(i)) {
                return i;
            }
        }
        return null;
    }

    async ensureCarPin(car, message = 'This car is protected. Enter the PIN shared by the driver.') {
        if (!car.requires_pin) {
            return true;
        }
        return await this.promptForCarPin(car, message);
    }

    promptForCarPin(car, message) {
        if (this.pinModalState) {
            // Resolve any existing pending promise as cancelled
            const { resolve } = this.pinModalState;
            this.pinModalState = null;
            if (resolve) {
                resolve(false);
            }
        }

        return new Promise((resolve) => {
            this.pinModalState = { carId: car.id, resolve };
            document.getElementById('pin-modal-title').textContent = `Enter PIN for ${car.car_model}`;
            document.getElementById('pin-modal-message').textContent = message;
            const input = document.getElementById('car-pin-input');
            input.value = '';
            document.getElementById('pin-modal').classList.remove('hidden');
            setTimeout(() => {
                input.focus();
            }, 50);
        });
    }

    async submitPinModal() {
        if (!this.pinModalState) return;

        const input = document.getElementById('car-pin-input');
        const pin = input.value.trim();
        if (!pin) {
            this.showMessage('Please enter the PIN.', 'error');
            input.focus();
            return;
        }

        try {
            const { carId, resolve } = this.pinModalState;
            const isValid = await DatabaseService.verifyCarPin(carId, pin);
            if (!isValid) {
                this.showMessage('Incorrect PIN. Please try again.', 'error');
                input.select();
                return;
            }

            this.hidePinModal();
            this.pinModalState = null;
            resolve(true);
        } catch (error) {
            console.error('Error verifying PIN:', error);
            this.showMessage('Could not verify PIN. Please try again.', 'error');
        }
    }

    cancelPinModal() {
        if (this.pinModalState) {
            const { resolve } = this.pinModalState;
            this.pinModalState = null;
            if (resolve) {
                resolve(false);
            }
        }
        this.hidePinModal();
    }

    hidePinModal() {
        const modal = document.getElementById('pin-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        const input = document.getElementById('car-pin-input');
        if (input) {
            input.value = '';
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
    async bookSeat(carId) {
        try {
            let car = this.currentCars.find(c => c.id === carId);
            if (!car) {
                const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
                this.currentCars = cars;
                car = cars.find(c => c.id === carId);
            }

            if (!car) {
                this.showMessage('Car not found.', 'error');
                return;
            }

            if (car.available_seats <= car.occupied_seats) {
                this.showMessage('No seats available in this car.', 'error');
                return;
            }

            this.currentBookingCarRequiresPin = car.requires_pin;
            this.currentBookingCarValidated = false;

            if (car.requires_pin) {
                const pinOk = await this.ensureCarPin(car, 'Enter the PIN to book a seat in this car.');
                if (!pinOk) {
                    return;
                }
            }

            this.currentBookingCarValidated = true;
            this.currentBookingCarId = carId;
            document.getElementById('passenger-name-input').value = '';
            document.getElementById('passenger-modal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('passenger-name-input').focus();
            }, 50);
        } catch (error) {
            console.error('Error preparing seat booking:', error);
            this.showMessage('Could not start booking. Please try again.', 'error');
        }
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
            this.currentCars = cars;
            const car = cars.find(c => c.id === this.currentBookingCarId);

            if (car && car.available_seats > car.occupied_seats) {
                if (car.requires_pin && !this.currentBookingCarValidated) {
                    this.showMessage('This car requires a PIN. Please try booking again.', 'error');
                    this.hidePassengerModal();
                    return;
                }

                const seatIndex = this.getNextAvailableSeatIndex(car);
                if (seatIndex === null) {
                    this.showMessage('No seats available in this car.', 'error');
                    this.hidePassengerModal();
                    return;
                }

                // Add passenger to database
                await DatabaseService.addPassenger({
                    car_id: this.currentBookingCarId,
                    name: passengerName,
                    seat_index: seatIndex,
                    request_passenger_id: null
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
                    passengerName: passenger.name,
                    requestPassengerId: passenger.request_passenger_id || null
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

    // Clear errors for a specific form
    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        const errors = form.querySelectorAll('.field-error');
        errors.forEach(error => error.remove());

        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            field.style.borderColor = '#e2e8f0';
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
        document.getElementById('ride-requests-section').classList.add('hidden');
        
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
        document.getElementById('car-requires-pin').checked = false;
        document.getElementById('car-pin-group').classList.add('hidden');
        document.getElementById('car-pin').value = '';
        this.resetRideRequestForm();
        const rideRequestsList = document.getElementById('ride-requests-list');
        if (rideRequestsList) {
            rideRequestsList.innerHTML = '';
        }
        const rideRequestsCount = document.getElementById('ride-requests-count');
        if (rideRequestsCount) {
            rideRequestsCount.textContent = '';
        }
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-date').value = today;
        
        this.currentCars = [];
        this.currentRideRequests = [];
        this.currentBookingCarId = null;
        this.currentBookingCarRequiresPin = false;
        this.currentBookingCarValidated = false;
        this.pendingAction = null;
        if (this.pinModalState) {
            const { resolve } = this.pinModalState;
            this.pinModalState = null;
            if (resolve) {
                resolve(false);
            }
        }
        this.hidePinModal();

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
        document.getElementById('car-requires-pin').checked = false;
        document.getElementById('car-pin-group').classList.add('hidden');
        document.getElementById('car-pin').value = '';
        
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

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Generate map link for an address (detects device and uses appropriate map app)
    getMapLink(address) {
        if (!address) return '#';
        // URL encode the address
        const encodedAddress = encodeURIComponent(address);
        
        // Detect if user is on iOS (iPhone/iPad)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
            // Use Apple Maps on iOS
            return `https://maps.apple.com/?q=${encodedAddress}`;
        } else {
            // Use Google Maps on other devices
            return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        }
    }

    // Generate arrow icon SVG for map links
    getMapArrowIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="m21.41 10.59-7.99-8c-.78-.78-2.05-.78-2.83 0l-8.01 8c-.78.78-.78 2.05 0 2.83l8.01 8c.78.78 2.05.78 2.83 0l7.99-8c.79-.79.79-2.05 0-2.83M13.5 14.5V12H10v3H8v-4c0-.55.45-1 1-1h4.5V7.5L17 11z"/>
        </svg>`;
    }

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
        this.currentBookingCarRequiresPin = false;
        this.currentBookingCarValidated = false;
    }

    hideConfirmModal() {
        document.getElementById('confirm-modal').classList.add('hidden');
        this.pendingAction = null;
    }

    async confirmAction() {
        if (!this.pendingAction) return;

        const { type, carId, seatIndex, passengerId, passengerName, carInfo, hasPassengers, requestId, riderName, requestPassengerId } = this.pendingAction;

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

                if (requestPassengerId) {
                    await DatabaseService.markRidePassengerWaiting(requestPassengerId);
                }

                // Refresh display
                await this.displayCars();
                this.showMessage(`Seat freed for ${passengerName}`, 'success');
            } else if (type === 'removeCar') {
                await DatabaseService.resetRidePassengersForCar(carId);
                // Remove car (passengers will be deleted automatically due to CASCADE)
                await DatabaseService.deleteCar(carId);
                
                // Refresh display
                await this.displayCars();
                
                if (hasPassengers) {
                    this.showMessage(`${carInfo} and all passengers removed`, 'success');
                } else {
                    this.showMessage(`${carInfo} removed`, 'success');
                }
            } else if (type === 'removeRideRequest') {
                await DatabaseService.deleteRideRequest(requestId);
                await this.displayRideRequests();
                this.showMessage(`Ride request for ${riderName} removed`, 'success');
            } else if (type === 'removeRidePassenger') {
                await DatabaseService.deleteRidePassenger(passengerId);
                await this.displayRideRequests();
                this.showMessage(`${passengerName} removed from the waitlist`, 'success');
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
    const eventParam = urlParams.get('event');
    
    if (eventParam) {
        const eventId = window.app.extractEventId(eventParam);
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
    }
});
