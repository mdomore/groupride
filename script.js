// Import Supabase client and database service
import { supabase, DatabaseService } from './supabase.js'

// Fallback for translation function if i18n.js hasn't loaded yet
const t = (key) => {
    if (typeof window.t === 'function') {
        return window.t(key);
    }
    // Fallback: return the key itself if translations aren't loaded
    return key;
};

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
        this.eventPasswordModalState = null;
        this.initializeLanguageSwitcher();
        this.initializeEventListeners();
        this.resetRideRequestForm();
        this.updatePageText();
    }

    // Initialize language switcher
    initializeLanguageSwitcher() {
        // Set initial active button
        const currentLang = (typeof window.getLanguage === 'function') ? window.getLanguage() : 'en';
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === currentLang) {
                btn.classList.add('active');
            }
        });
        
        // Add click handlers
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                if (typeof window.setLanguage === 'function' && window.setLanguage(lang)) {
                    // Update active button
                    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // Update page text
                    this.updatePageText();
                }
            });
        });
        
        // Listen for language change events
        window.addEventListener('languageChanged', () => {
            this.updatePageText();
            // Explicitly update delete button
            const deleteBtn = document.getElementById('delete-event-btn');
            if (deleteBtn && deleteBtn.hasAttribute('data-i18n')) {
                deleteBtn.textContent = t(deleteBtn.getAttribute('data-i18n'));
            }
        });
    }
    
    // Update all text on the page with translations
    updatePageText() {
        // Update header
        const headerSubtitle = document.querySelector('header p');
        if (headerSubtitle) headerSubtitle.textContent = t('appSubtitle');
        
        // Update all elements with data-i18n attribute directly (without triggering events)
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                    element.value = t(key);
                } else if (element.tagName === 'BUTTON' || (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA')) {
                    // Explicitly handle BUTTON elements and other non-input elements
                    element.textContent = t(key);
                }
            }
        });
        
        // Explicitly ensure delete button is translated
        const deleteBtn = document.getElementById('delete-event-btn');
        if (deleteBtn && deleteBtn.hasAttribute('data-i18n')) {
            deleteBtn.textContent = t(deleteBtn.getAttribute('data-i18n'));
        }
        
        // Update dynamic content separately
        if (this.currentEventId) {
            // Refresh the current view to update dynamic content
            this.displayEventView();
        }
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

        document.getElementById('delete-event-btn').addEventListener('click', () => {
            this.deleteEvent();
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

        // Event password modal
        document.getElementById('confirm-event-password').addEventListener('click', () => {
            this.submitEventPasswordModal();
        });

        document.getElementById('cancel-event-password').addEventListener('click', () => {
            this.cancelEventPasswordModal();
        });

        // Ride request form
        document.getElementById('ride-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createRideRequest();
        });

        document.getElementById('open-ride-request-modal').addEventListener('click', () => {
            this.showRideRequestModal();
        });

        document.getElementById('cancel-ride-request').addEventListener('click', () => {
            this.hideRideRequestModal();
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

        document.getElementById('event-password-modal').addEventListener('click', (e) => {
            if (e.target.id === 'event-password-modal') {
                this.cancelEventPasswordModal();
            }
        });

        document.getElementById('ride-request-modal').addEventListener('click', (e) => {
            if (e.target.id === 'ride-request-modal') {
                this.hideRideRequestModal();
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

        document.getElementById('event-password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitEventPasswordModal();
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
        const eventPassword = document.getElementById('event-password').value.trim();

        // Validate inputs
        if (!eventName) {
            this.showFieldError('event-name', t('eventNameRequired'));
            return;
        }

        if (!eventDate) {
            this.showFieldError('event-date', t('eventDateRequired'));
            return;
        }

        if (!eventTime) {
            this.showFieldError('event-time', t('eventTimeRequired'));
            return;
        }

        // Check if date is in the past
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        if (eventDateTime < new Date()) {
            this.showFieldError('event-date', t('eventDatePast'));
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

            // Hash password if provided
            let passwordHash = null;
            if (eventPassword) {
                passwordHash = await DatabaseService.hashPassword(eventPassword);
            }

            // Create event object
            const event = {
                id: eventId,
                name: eventName,
                description: eventDescription,
                date: eventDate,
                time: eventTime,
                password_hash: passwordHash
            };

            // Save event to database
            await DatabaseService.createEvent(event);

            // Show event details
            this.showEventDetails(eventId);
            this.showMessage(t('eventCreatedSuccess'), 'success');
        } catch (error) {
            console.error('Error creating event:', error);
            this.showMessage(t('failedToCreateEvent'), 'error');
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
            this.showMessage(t('createOrJoinFirst'), 'error');
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
            this.showFieldError('driver-name', t('driverNameRequired'));
            return;
        }

        if (!carModel) {
            this.showFieldError('car-model', t('carModelRequired'));
            return;
        }

        if (!availableSeats || availableSeats < 1 || availableSeats > 8) {
            this.showFieldError('available-seats', t('seatsRequired'));
            return;
        }

        if (requiresPin && carPin.length < 4) {
            this.showFieldError('car-pin', t('pinMinLength'));
            return;
        }

        // Clear any previous errors
        this.clearFormErrors('car-form');

        try {
            if (this.editingCarId) {
                // Update existing car
                const updates = {
                    driver_name: driverName,
                    driver_phone: driverPhone || null,
                    driver_email: driverEmail || null,
                    car_model: carModel,
                    available_seats: availableSeats,
                    pickup_address: pickupAddress || null,
                    dropoff_address: dropoffAddress || null,
                    requires_pin: requiresPin
                };

                // Only update PIN if provided
                if (requiresPin && carPin) {
                    updates.car_pin = carPin;
                } else if (!requiresPin) {
                    updates.car_pin = null;
                }

                await DatabaseService.updateCar(this.editingCarId, updates);
                this.editingCarId = null;
                this.showMessage(t('carUpdatedSuccess'), 'success');
            } else {
                // Create new car
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

            await DatabaseService.createCar(car);
                this.showMessage(t('carRegisteredSuccess'), 'success');
            }

            // Clear form
            document.getElementById('car-form').reset();
            document.getElementById('car-pin-group').classList.add('hidden');

            // Reset form title and button
            const carSection = document.getElementById('car-registration');
            const title = carSection.querySelector('h2');
            title.textContent = t('registerYourCar');
            
            const submitBtn = carSection.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = t('registerCar');
            }

            // Hide car registration and show event view
            carSection.classList.add('hidden');
            this.displayEventView();
        } catch (error) {
            console.error('Error registering car:', error);
            this.showMessage(t('failedToRegisterCar'), 'error');
        }
    }

    // Create a ride request for the current event
    async createRideRequest() {
        if (!this.currentEventId) {
            this.showMessage(t('joinOrCreateFirst'), 'error');
            return;
        }

        const contactName = document.getElementById('ride-request-contact-name').value.trim();
        const contactPhone = document.getElementById('ride-request-contact-phone').value.trim();
        const pickupAddress = document.getElementById('ride-request-pickup-address').value.trim();
        const dropoffAddress = document.getElementById('ride-request-dropoff-address').value.trim();
        const notes = document.getElementById('ride-request-notes').value.trim();
        const passengerNames = this.getPassengerInputValues();

        if (!contactName) {
            this.showFieldError('ride-request-contact-name', t('contactNameRequired'));
            return;
        }

        if (passengerNames.length === 0) {
            this.showMessage(t('addRiderName'), 'error');
            return;
        }

        // Add contact to passenger list only if checkbox is checked
        const contactAlsoNeedsRide = document.getElementById('contact-also-needs-ride').checked;
        if (contactAlsoNeedsRide && !passengerNames.some(name => name.toLowerCase() === contactName.toLowerCase())) {
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
            this.hideRideRequestModal();
            await this.displayRideRequests();
            this.showMessage(t('rideRequestPosted'), 'success');
        } catch (error) {
            console.error('Error creating ride request:', error);
            this.showMessage(t('failedToPostRideRequest'), 'error');
        }
    }

    // Join an existing event
    async joinEvent() {
        const input = document.getElementById('join-event-id').value.trim();
        
        // Extract event ID from input (handles both event ID and full URL)
        const eventId = this.extractEventId(input);
        
        if (!eventId) {
            this.showMessage(t('invalidEventId'), 'error');
            return;
        }

        try {
            await DatabaseService.getEvent(eventId);
            this.currentEventId = eventId;
            this.displayEventView();
        } catch (error) {
            this.showMessage(t('eventNotFound'), 'error');
        }
    }

    // Extract event ID from input (handles both event ID and full URL)
    extractEventId(input) {
        if (!input) return null;
        
        // Clean input - remove any colon and characters after it (e.g., "ASN9UH7K:1" -> "ASN9UH7K")
        const cleaned = input.split(':')[0].trim().toUpperCase();
        
        // If it's already just an event ID (8-9 characters, alphanumeric - flexible for existing events)
        if (/^[A-Z0-9]{8,9}$/.test(cleaned)) {
            return cleaned;
        }
        
        // If it's a URL, try to extract the event ID from query parameters
        try {
            const url = new URL(input);
            const eventParam = url.searchParams.get('event');
            if (eventParam) {
                const cleanedParam = eventParam.split(':')[0].trim().toUpperCase();
                // Accept 8-9 character event IDs
                if (/^[A-Z0-9]{8,9}$/.test(cleanedParam)) {
                    return cleanedParam;
                }
            }
        } catch (e) {
            // If URL parsing fails, try to extract from the path or just the input
            // Look for 8-9 character alphanumeric strings
            const match = cleaned.match(/[A-Z0-9]{8,9}/);
            if (match) {
                return match[0].toUpperCase();
            }
        }
        
        return null;
    }

    // Show edit event form with current event data
    async showEditEventForm() {
        if (!this.currentEventId) {
            this.showMessage(t('noEventToEdit'), 'error');
            return;
        }

        try {
            // Get current event data
            const event = await DatabaseService.getEvent(this.currentEventId);
            
            // Check if event has a password
            if (event.password_hash) {
                // Prompt for password
                const passwordOk = await this.promptForEventPassword();
                if (!passwordOk) {
                    return; // User cancelled or entered wrong password
                }
            }
            
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
            this.showMessage(t('failedToLoadEvent'), 'error');
        }
    }

    // Prompt for event password
    promptForEventPassword() {
        return new Promise((resolve) => {
            this.eventPasswordModalState = { resolve };
            document.getElementById('event-password-modal-title').textContent = t('titleEnterEventPassword');
            document.getElementById('event-password-modal-message').textContent = t('msgEventPasswordRequired');
            const input = document.getElementById('event-password-input');
            input.value = '';
            document.getElementById('event-password-modal').classList.remove('hidden');
            setTimeout(() => {
                input.focus();
            }, 50);
        });
    }

    // Submit event password modal
    async submitEventPasswordModal() {
        if (!this.eventPasswordModalState) return;

        const input = document.getElementById('event-password-input');
        const password = input.value.trim();
        if (!password) {
            this.showMessage(t('eventPasswordRequiredError'), 'error');
            input.focus();
            return;
        }

        try {
            const { resolve } = this.eventPasswordModalState;
            const isValid = await DatabaseService.verifyEventPassword(this.currentEventId, password);
            if (!isValid) {
                this.showMessage(t('incorrectEventPassword'), 'error');
                input.select();
                return;
            }

            this.hideEventPasswordModal();
            this.eventPasswordModalState = null;
            resolve(true);
        } catch (error) {
            console.error('Error verifying event password:', error);
            this.showMessage(t('incorrectEventPassword'), 'error');
        }
    }

    // Cancel event password modal
    cancelEventPasswordModal() {
        if (this.eventPasswordModalState) {
            const { resolve } = this.eventPasswordModalState;
            this.eventPasswordModalState = null;
            if (resolve) {
                resolve(false);
            }
        }
        this.hideEventPasswordModal();
    }

    // Hide event password modal
    hideEventPasswordModal() {
        const modal = document.getElementById('event-password-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        const input = document.getElementById('event-password-input');
        if (input) {
            input.value = '';
        }
    }

    // Handle edit event form submission
    async editEvent() {
        if (!this.currentEventId) {
            this.showMessage(t('noEventToEdit'), 'error');
            return;
        }

        const eventName = document.getElementById('edit-event-name').value.trim();
        const eventDescription = document.getElementById('edit-event-description').value.trim();
        const eventDate = document.getElementById('edit-event-date').value;
        const eventTime = document.getElementById('edit-event-time').value;

        // Validate inputs (same validation as create event)
        if (!eventName) {
            this.showFieldError('edit-event-name', t('eventNameRequired'));
            return;
        }

        if (!eventDate) {
            this.showFieldError('edit-event-date', t('eventDateRequired'));
            return;
        }

        if (!eventTime) {
            this.showFieldError('edit-event-time', t('eventTimeRequired'));
            return;
        }

        // Check if date is in the past
        const eventDateTime = new Date(`${eventDate}T${eventTime}`);
        if (eventDateTime < new Date()) {
            this.showFieldError('edit-event-date', t('eventDatePast'));
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
            this.showMessage(t('eventUpdatedSuccess'), 'success');
        } catch (error) {
            console.error('Error updating event:', error);
            this.showMessage(t('failedToUpdateEvent'), 'error');
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

    async deleteEvent() {
        if (!this.currentEventId) {
            this.showMessage(t('noEventToEdit'), 'error');
            return;
        }

        try {
            // Check if event has password and prompt for it
            const event = await DatabaseService.getEvent(this.currentEventId);
            if (event.password_hash) {
                const passwordVerified = await this.promptForEventPassword();
                if (!passwordVerified) {
                    return; // User cancelled or entered wrong password
                }
            }

            // Show confirmation modal
            this.pendingAction = { type: 'deleteEvent', eventId: this.currentEventId };
            document.getElementById('confirm-title').textContent = t('actionDeleteEvent');
            document.getElementById('confirm-message').textContent = t('deleteEventConfirm');
            document.getElementById('confirm-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Error loading event for deletion:', error);
            this.showMessage(t('failedToLoadEvent'), 'error');
        }
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
            
            // Ensure button translations are applied after view is shown
            const deleteBtn = document.getElementById('delete-event-btn');
            if (deleteBtn && deleteBtn.hasAttribute('data-i18n')) {
                deleteBtn.textContent = t(deleteBtn.getAttribute('data-i18n'));
            }

            this.currentCars = [];

            // Display cars
            await this.displayCars();
        } catch (error) {
            console.error('Error loading event:', error);
            this.showMessage(t('failedToLoadEvent'), 'error');
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
                        <h3>${t('noCarsRegistered')}</h3>
                        <button onclick="window.app.showAddCarForm()" class="add-car-btn">
                            ${t('registerFirstCar')}
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
                    <div class="summary-row">
                        <h3>${t('availableCars')} (${cars.length})</h3>
                        <span class="stat">${totalSeats} ${t('totalSeats')}</span>
                    </div>
                    <div class="summary-row">
                        <span class="stat">${occupiedSeats} ${t('occupied')}</span>
                        <span class="stat highlight">${availableSeats} ${t('available')}</span>
                    </div>
                    <button onclick="window.app.showAddCarForm()" class="add-car-btn">
                        ${t('addCar')}
                    </button>
                </div>
                ${cars.map((car, index) => {
                    // Calculate occupied seats from passengers if available, otherwise use stored value
                    const actualOccupiedSeats = (car.passengers && car.passengers.length > 0) 
                        ? car.passengers.length 
                        : (car.occupied_seats || 0);
                    const freeSeatsCount = car.available_seats - actualOccupiedSeats;
                    const freeSeatsText = freeSeatsCount === 1 ? t('freeSeats') : t('freeSeatsPlural');
                    const badgeText = `${freeSeatsCount} ${freeSeatsText}${car.requires_pin ? ' • ' + t('pinRequired') : ''}`;
                    const hasFreeSeats = freeSeatsCount > 0;
                    const badgeClass = hasFreeSeats ? 'has-seats' : 'no-seats';
                    return `
                    <div class="car-item">
                        <div class="car-header">
                            <div class="car-header-row">
                                <h4>${t('car')} #${index + 1}: ${car.car_model} - ${car.driver_name}</h4>
                            <div class="car-actions">
                            ${(car.driver_phone || car.driver_email) ? `
                                <div class="driver-contact">
                                    ${car.driver_phone ? `<span>${car.driver_phone}</span>` : ''}
                                    ${car.driver_email ? `<span>${car.driver_email}</span>` : ''}
                                </div>
                            ` : ''}
                                    <div class="car-menu-container">
                                        <span class="car-menu-trigger" onclick="window.app.toggleCarMenu(${car.id})" title="${t('moreOptions')}">⋯</span>
                                        <div id="car-menu-${car.id}" class="car-menu hidden">
                                            <button onclick="window.app.editCar(${car.id})" class="car-menu-item">
                                                ${t('edit')}
                                            </button>
                                            <button onclick="window.app.removeCar(${car.id})" class="car-menu-item car-menu-item-danger">
                                                ${t('remove')}
                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="car-badge-row">
                                <span class="car-pin-badge ${badgeClass}">${badgeText}</span>
                            </div>
                        </div>
                        ${(car.pickup_address || car.dropoff_address) ? `
                            <div class="car-addresses">
                                ${car.pickup_address ? `
                                    <div class="car-address">
                                        <strong>${t('pickup')}</strong> ${this.escapeHtml(car.pickup_address)} 
                                        <a href="${this.getMapLink(car.pickup_address)}" target="_blank" class="map-link" title="Open in map app">${this.getMapArrowIcon()}</a>
                                    </div>
                                ` : ''}
                                ${car.dropoff_address ? `
                                    <div class="car-address">
                                        <strong>${t('dropoff')}</strong> ${this.escapeHtml(car.dropoff_address)}
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
                `;
                }).join('')}
            `;
        } catch (error) {
            console.error('Error loading cars:', error);
            this.showMessage(t('failedToLoadCars'), 'error');
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
        input.placeholder = t('placeholderPassengerName');
        input.value = value;
        input.setAttribute('data-role', 'ride-passenger-input');

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-passenger-btn secondary-btn';
        removeBtn.textContent = t('remove');
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
                    ? t('noRidersWaiting')
                    : `${waitingCount} ${t('ridersWaiting')}`;
            }

            if (requests.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <p>${t('noRideRequests')}</p>
                    </div>
                `;
                return;
            }

            const sortedRequests = [...requests].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            list.innerHTML = sortedRequests.map(request => this.renderRideRequestItem(request)).join('');
        } catch (error) {
            console.error('Error loading ride requests:', error);
            this.showMessage(t('failedToLoadRideRequests'), 'error');
        }
    }

    renderRideRequestItem(request) {
        const metaLines = [];
        if (request.contact_phone) {
            metaLines.push(`${t('phone')} ${this.escapeHtml(request.contact_phone)}`);
        }
        if (request.pickup_address) {
            const mapLink = this.getMapLink(request.pickup_address);
            metaLines.push(`${t('pickup')} ${this.escapeHtml(request.pickup_address)} <a href="${mapLink}" target="_blank" class="map-link" title="Open in map app">${this.getMapArrowIcon()}</a>`);
        }
        if (request.dropoff_address) {
            metaLines.push(`${t('dropoff')} ${this.escapeHtml(request.dropoff_address)}`);
        }
        if (request.notes) {
            metaLines.push(`${t('notes')} ${this.escapeHtml(request.notes)}`);
        }

        const metaHtml = metaLines.length > 0
            ? `<div class="ride-request-meta">${metaLines.map(line => `<span>${line}</span>`).join('')}</div>`
            : '';

        const passengers = [...(request.ride_request_passengers || [])]
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const availableCars = this.currentCars.filter(car => car.available_seats > car.occupied_seats);

        const passengersHtml = passengers.length === 0
            ? `<div class="empty-state"><p>${t('noRidersListed')}</p></div>`
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
                    <button class="secondary-btn" onclick="window.app.removeRideRequest(${request.id})">${t('removeRequest')}</button>
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
                    const pinLabel = car.requires_pin ? ` (${t('pin')})` : '';
                    const seatText = seatsLeft === 1 ? t('available').toLowerCase() : t('available').toLowerCase();
                    return `<option value="${car.id}">${car.car_model} (${car.driver_name}) • ${seatsLeft} ${seatText}${pinLabel}</option>`;
                }).join('');

                controlsHtml = `
                    <div class="assign-controls">
                        <select id="assign-select-${passenger.id}" class="assign-select">
                            <option value="">${t('selectACar')}</option>
                            ${options}
                        </select>
                        <button type="button" class="secondary-btn" onclick="window.app.assignPassengerToSelectedCar(${passenger.id})">${t('assign')}</button>
                        <button type="button" class="remove-passenger-btn" onclick="window.app.removeRidePassenger(${passenger.id})">${t('remove')}</button>
                    </div>
                `;
            } else {
                controlsHtml = `
                    <div class="assign-controls no-cars">
                        <div class="ride-request-meta">${t('noCarsWithFreeSeats')}</div>
                        <button type="button" class="remove-passenger-btn" onclick="window.app.removeRidePassenger(${passenger.id})">${t('remove')}</button>
                    </div>
                `;
            }
        } else {
            const assignedCar = this.currentCars.find(car => car.id === passenger.assigned_car_id);
            controlsHtml = `
                <div class="ride-request-meta">
                    <span>${t('assignedTo')} ${assignedCar ? `${assignedCar.car_model} (${assignedCar.driver_name})` : t('car').toLowerCase()}.</span>
                </div>
            `;
        }

        return `
            <div class="ride-request-passenger ${statusClass}">
                <header>
                    <h4>${passenger.name}</h4>
                    <span class="status-tag ${statusClass}">${passenger.status === 'waiting' ? t('waiting') : t('assigned')}</span>
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

        document.getElementById('confirm-title').textContent = t('removeRideRequest');
        document.getElementById('confirm-message').textContent = `${t('removeRideRequestConfirm')} ${request.contact_name}?`;
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

        document.getElementById('confirm-title').textContent = t('removeRider');
        document.getElementById('confirm-message').textContent = `${t('removeRiderConfirm')} ${passenger.name} from ${request.contact_name}'s waitlist?`;
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    async assignPassengerToSelectedCar(passengerId) {
        const select = document.getElementById(`assign-select-${passengerId}`);
        if (!select) {
            this.showMessage(t('selectCarBeforeAssign'), 'error');
            return;
        }

        const carId = parseInt(select.value, 10);
        if (!carId) {
            this.showMessage(t('chooseCarBeforeAssign'), 'error');
            return;
        }

        await this.assignPassengerToCar(passengerId, carId);
    }

    async assignPassengerToCar(passengerId, carId) {
        try {
            const found = this.findRideRequestPassenger(passengerId);
            if (!found) {
                this.showMessage(t('riderNotFound'), 'error');
                return;
            }

            const { passenger } = found;

            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            this.currentCars = cars;
            const car = cars.find(c => c.id === carId);

            if (!car) {
                this.showMessage(t('carNotFound'), 'error');
                return;
            }

            if (car.available_seats <= car.occupied_seats) {
                this.showMessage(t('noSeatsAvailable'), 'error');
                return;
            }

            const pinOk = await this.ensureCarPin(car, t('enterPinBeforeAssign'));
            if (!pinOk) {
                return;
            }

            const seatIndex = this.getNextAvailableSeatIndex(car);
            if (seatIndex === null) {
                this.showMessage(t('noSeatsAvailable'), 'error');
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
            this.showMessage(`${passenger.name} ${t('assignedToCar')} ${car.car_model}.`, 'success');
        } catch (error) {
            console.error('Error assigning passenger:', error);
            this.showMessage(t('failedToAssignRider'), 'error');
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

    async ensureCarPin(car, message = null) {
        if (!car.requires_pin) {
            return true;
        }
        const pinMessage = message || t('pinProtectedMessage');
        return await this.promptForCarPin(car, pinMessage);
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
            document.getElementById('pin-modal-title').textContent = `${t('enterPinFor')} ${car.car_model}`;
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
            this.showMessage(t('enterPin'), 'error');
            input.focus();
            return;
        }

        try {
            const { carId, resolve } = this.pinModalState;
            const isValid = await DatabaseService.verifyCarPin(carId, pin);
            if (!isValid) {
                this.showMessage(t('incorrectPin'), 'error');
                input.select();
                return;
            }

            this.hidePinModal();
            this.pinModalState = null;
            resolve(true);
        } catch (error) {
            console.error('Error verifying PIN:', error);
            this.showMessage(t('couldNotVerifyPin'), 'error');
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
                <div class="${seatClass}" onclick="${isOccupied ? `window.app.freeSeat(${car.id}, ${i})` : `window.app.bookSeat(${car.id})`}" title="${isOccupied ? t('freeSeatConfirm') + ' ' + passengerName : t('bookASeat')}">
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
                this.showMessage(t('carNotFound'), 'error');
                return;
            }

            if (car.available_seats <= car.occupied_seats) {
                this.showMessage(t('noSeatsAvailableThisCar'), 'error');
                return;
            }

            this.currentBookingCarRequiresPin = car.requires_pin;
            this.currentBookingCarValidated = false;

            if (car.requires_pin) {
                const pinOk = await this.ensureCarPin(car, t('enterPinToBook'));
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
            this.showMessage(t('couldNotStartBooking'), 'error');
        }
    }

    // Confirm booking from modal
    async confirmBooking() {
        const passengerName = document.getElementById('passenger-name-input').value.trim();
        if (!passengerName) {
            this.showMessage(t('enterValidName'), 'error');
            return;
        }

        try {
            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            this.currentCars = cars;
            const car = cars.find(c => c.id === this.currentBookingCarId);

            if (car && car.available_seats > car.occupied_seats) {
                if (car.requires_pin && !this.currentBookingCarValidated) {
                    this.showMessage(t('carRequiresPin'), 'error');
                    this.hidePassengerModal();
                    return;
                }

                const seatIndex = this.getNextAvailableSeatIndex(car);
                if (seatIndex === null) {
                    this.showMessage(t('noSeatsAvailableThisCar'), 'error');
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
                this.showMessage(`${t('seatBooked')} ${passengerName}!`, 'success');
                this.hidePassengerModal();
            } else {
                this.showMessage(t('noSeatsAvailableThisCar'), 'error');
                this.hidePassengerModal();
            }
        } catch (error) {
            console.error('Error booking seat:', error);
            this.showMessage(t('failedToBookSeat'), 'error');
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
                document.getElementById('confirm-title').textContent = t('freeSeat');
                document.getElementById('confirm-message').textContent = `${t('freeSeatConfirm')} ${passenger.name}?`;
                document.getElementById('confirm-modal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error freeing seat:', error);
            this.showMessage(t('failedToFreeSeat'), 'error');
        }
    }

    // Remove a car from the event
    async removeCar(carId) {
        try {
            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            const car = cars.find(c => c.id === carId);
            
            if (!car) {
                this.showMessage(t('carNotFound'), 'error');
                return;
            }

            // Check if car requires PIN
            if (car.requires_pin) {
                const pinOk = await this.ensureCarPin(car, t('enterPinToRemove'));
                if (!pinOk) {
                    return;
                }
            }

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
            document.getElementById('confirm-title').textContent = t('removeCar');
            let message = `${t('removeCarConfirm')} ${carInfo}?`;
                if (hasPassengers) {
                message += `\n\n${t('removeCarWithPassengers')} ${car.passengers.length} ${t('passenger')}`;
                }
                document.getElementById('confirm-message').textContent = message;
                document.getElementById('confirm-modal').classList.remove('hidden');
        } catch (error) {
            console.error('Error removing car:', error);
            this.showMessage(t('failedToRemoveCar'), 'error');
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
        title.textContent = t('registerYourCar');
        
        // Clear forms
        document.getElementById('event-form').reset();
        document.getElementById('event-password').value = '';
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
        if (this.eventPasswordModalState) {
            const { resolve } = this.eventPasswordModalState;
            this.eventPasswordModalState = null;
            if (resolve) {
                resolve(false);
            }
        }
        this.hideEventPasswordModal();

        this.clearFieldErrors();
    }


    // Copy current event ID to clipboard
    copyCurrentEventId() {
        const eventId = this.currentEventId;
        const shareUrl = `${window.location.origin}${window.location.pathname}?event=${eventId}`;
        
        // Check if modern clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showMessage(t('eventLinkCopied'), 'success');
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
            this.showMessage(t('eventLinkCopied'), 'success');
        } catch (err) {
            this.showMessage(t('failedToCopy') + ' ' + text, 'error');
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
        title.textContent = t('addAnotherCar');
        
        // Hide event view and show only car registration
        document.getElementById('event-view').classList.add('hidden');
        carSection.classList.remove('hidden');
        
        // Focus on the first input
        setTimeout(() => {
            document.getElementById('driver-name').focus();
        }, 100);
    }

    // Toggle car menu
    toggleCarMenu(carId) {
        // Close all other menus
        document.querySelectorAll('.car-menu').forEach(menu => {
            if (menu.id !== `car-menu-${carId}`) {
                menu.classList.add('hidden');
            }
        });
        
        const menu = document.getElementById(`car-menu-${carId}`);
        if (menu) {
            menu.classList.toggle('hidden');
        }
        
        // Close menu when clicking outside
        if (!menu.classList.contains('hidden')) {
            setTimeout(() => {
                const closeMenu = (e) => {
                    if (!menu.contains(e.target) && !e.target.closest('.car-menu-trigger')) {
                        menu.classList.add('hidden');
                        document.removeEventListener('click', closeMenu);
                    }
                };
                document.addEventListener('click', closeMenu);
            }, 0);
        }
    }

    // Edit a car
    async editCar(carId) {
        try {
            // Close all menus
            document.querySelectorAll('.car-menu').forEach(menu => {
                menu.classList.add('hidden');
            });

            const cars = await DatabaseService.getCarsForEvent(this.currentEventId);
            const car = cars.find(c => c.id === carId);
            
            if (!car) {
                this.showMessage(t('carNotFound'), 'error');
                return;
            }

            // Check if car requires PIN
            if (car.requires_pin) {
                const pinOk = await this.ensureCarPin(car, t('enterPinToEdit'));
                if (!pinOk) {
                    return;
                }
            }

            // Store editing car ID
            this.editingCarId = carId;

            // Populate form with car data
            document.getElementById('driver-name').value = car.driver_name || '';
            document.getElementById('driver-phone').value = car.driver_phone || '';
            document.getElementById('driver-email').value = car.driver_email || '';
            document.getElementById('car-model').value = car.car_model || '';
            document.getElementById('available-seats').value = car.available_seats || 1;
            document.getElementById('car-pickup-address').value = car.pickup_address || '';
            document.getElementById('car-dropoff-address').value = car.dropoff_address || '';
            document.getElementById('car-requires-pin').checked = car.requires_pin || false;
            
            // Show/hide PIN field
            const pinGroup = document.getElementById('car-pin-group');
            if (car.requires_pin) {
                pinGroup.classList.remove('hidden');
                document.getElementById('car-pin').value = ''; // Don't show existing PIN for security
            } else {
                pinGroup.classList.add('hidden');
                document.getElementById('car-pin').value = '';
            }

            // Update form title and submit button
            const carSection = document.getElementById('car-registration');
            const title = carSection.querySelector('h2');
            title.textContent = t('editCar');
            
            const submitBtn = carSection.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = t('updateCar');
            }

            // Show form
            document.getElementById('event-view').classList.add('hidden');
            carSection.classList.remove('hidden');

            // Focus on first input
            setTimeout(() => {
                document.getElementById('driver-name').focus();
            }, 100);
        } catch (error) {
            console.error('Error editing car:', error);
            this.showMessage(t('failedToEditCar'), 'error');
        }
    }

    // Cancel adding a car and return to event view
    cancelAddCar() {
        // Clear the form
        document.getElementById('car-form').reset();
        this.editingCarId = null;
        this.clearFieldErrors();
        document.getElementById('car-requires-pin').checked = false;
        document.getElementById('car-pin-group').classList.add('hidden');
        document.getElementById('car-pin').value = '';
        
        // Reset form title and button
        const carSection = document.getElementById('car-registration');
        const title = carSection.querySelector('h2');
        title.textContent = t('registerYourCar');
        
        const submitBtn = carSection.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = t('registerCar');
        }
        
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
        const lang = getLanguage() === 'fr' ? 'fr-FR' : 'en-US';
        return date.toLocaleDateString(lang, {
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
        const lang = getLanguage() === 'fr' ? 'fr-FR' : 'en-US';
        return date.toLocaleTimeString(lang, {
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

    showRideRequestModal() {
        const modal = document.getElementById('ride-request-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Reset form and add first passenger input
            this.resetRideRequestForm();
            // Focus on first input
            setTimeout(() => {
                const firstInput = document.getElementById('ride-request-contact-name');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    hideRideRequestModal() {
        const modal = document.getElementById('ride-request-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.resetRideRequestForm();
        }
    }

    async confirmAction() {
        if (!this.pendingAction) return;

        const { type, carId, seatIndex, passengerId, passengerName, carInfo, hasPassengers, requestId, riderName, requestPassengerId, eventId } = this.pendingAction;

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
                this.showMessage(`${t('seatFreed')} ${passengerName}`, 'success');
            } else if (type === 'removeCar') {
                await DatabaseService.resetRidePassengersForCar(carId);
                // Remove car (passengers will be deleted automatically due to CASCADE)
                await DatabaseService.deleteCar(carId);
                
                // Refresh display
                await this.displayCars();
                
                if (hasPassengers) {
                    this.showMessage(`${carInfo} ${t('removeCarWithPassengers').toLowerCase()}`, 'success');
                } else {
                    this.showMessage(`${carInfo} ${t('remove')}`, 'success');
                }
            } else if (type === 'removeRideRequest') {
                await DatabaseService.deleteRideRequest(requestId);
                // Refresh both ride requests and cars (in case seats were freed)
                await this.displayRideRequests();
                await this.displayCars();
                this.showMessage(`${t('removeRequest')} ${riderName}`, 'success');
            } else if (type === 'removeRidePassenger') {
                await DatabaseService.deleteRidePassenger(passengerId);
                await this.displayRideRequests();
                this.showMessage(`${passengerName} ${t('remove')}`, 'success');
            } else if (type === 'deleteEvent') {
                // Delete event (all related data will be deleted automatically due to CASCADE)
                await DatabaseService.deleteEvent(eventId);
                
                // Reset to create event view
                this.resetToCreateEvent();
                
                this.showMessage(t('eventDeletedSuccess'), 'success');
            }

            this.hideConfirmModal();
        } catch (error) {
            console.error('Error confirming action:', error);
            this.showMessage(t('failedToCompleteAction'), 'error');
        }
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit to ensure i18n.js is loaded
    if (typeof window.t === 'undefined') {
        // If i18n.js hasn't loaded yet, wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Initialize translations first
    if (typeof window.updatePageLanguage === 'function') {
        window.updatePageLanguage();
    }
    
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
