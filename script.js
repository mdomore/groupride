// Simple data storage using localStorage
class GroupRideApp {
    constructor() {
        this.currentEventId = null;
        this.events = this.loadEvents();
        this.initializeEventListeners();
    }

    // Load events from localStorage
    loadEvents() {
        const stored = localStorage.getItem('groupRideEvents');
        return stored ? JSON.parse(stored) : {};
    }

    // Save events to localStorage
    saveEvents() {
        localStorage.setItem('groupRideEvents', JSON.stringify(this.events));
    }

    // Generate a simple event ID
    generateEventId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
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

        // Copy button
        document.getElementById('copy-btn').addEventListener('click', () => {
            this.copyEventLink();
        });

        // Back to create event button
        document.getElementById('back-to-create').addEventListener('click', () => {
            this.resetToCreateEvent();
        });
    }

    // Create a new event
    createEvent() {
        const eventName = document.getElementById('event-name').value.trim();
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

        // Generate unique event ID
        let eventId;
        do {
            eventId = this.generateEventId();
        } while (this.events[eventId]);

        // Create event object
        const event = {
            id: eventId,
            name: eventName,
            date: eventDate,
            time: eventTime,
            cars: [],
            passengers: []
        };

        // Save event
        this.events[eventId] = event;
        this.saveEvents();

        // Show event details
        this.showEventDetails(eventId);
        this.showMessage('Event created successfully!', 'success');
        
        // Auto-copy event ID
        setTimeout(() => {
            this.copyEventLink();
        }, 1000);
    }

    // Show event details after creation
    showEventDetails(eventId) {
        this.currentEventId = eventId;
        const event = this.events[eventId];
        
        // Update display
        document.getElementById('event-id-display').textContent = eventId;
        document.getElementById('share-url').value = `${window.location.origin}${window.location.pathname}?event=${eventId}`;
        
        // Show relevant sections
        document.getElementById('event-details').classList.remove('hidden');
        document.getElementById('car-registration').classList.remove('hidden');
        document.getElementById('join-event').classList.add('hidden');
    }

    // Register a car for the current event
    registerCar() {
        if (!this.currentEventId) {
            this.showMessage('Please create or join an event first!', 'error');
            return;
        }

        const driverName = document.getElementById('driver-name').value.trim();
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

        const car = {
            id: Date.now(), // Simple ID generation
            driverName,
            carModel,
            availableSeats,
            occupiedSeats: 0,
            passengers: []
        };

        // Add car to event
        this.events[this.currentEventId].cars.push(car);
        this.saveEvents();

        // Clear form
        document.getElementById('car-form').reset();

        // Refresh event view
        this.displayEventView();
        this.showMessage('Car registered successfully!', 'success');
    }

    // Join an existing event
    joinEvent() {
        const eventId = document.getElementById('join-event-id').value.toUpperCase();
        
        if (this.events[eventId]) {
            this.currentEventId = eventId;
            this.displayEventView();
            this.showMessage('Successfully joined event!', 'success');
        } else {
            this.showMessage('Event not found. Please check the Event ID.', 'error');
        }
    }

    // Display the event view with cars and booking options
    displayEventView() {
        if (!this.currentEventId) return;

        const event = this.events[this.currentEventId];
        document.getElementById('current-event-name').textContent = event.name;
        
        // Show event view section
        document.getElementById('event-view').classList.remove('hidden');
        document.getElementById('join-event').classList.add('hidden');

        // Display cars
        this.displayCars();
    }

    // Display all cars for the current event
    displayCars() {
        const event = this.events[this.currentEventId];
        const carsList = document.getElementById('cars-list');
        
        if (event.cars.length === 0) {
            carsList.innerHTML = '<p>No cars registered yet. Be the first to register your car!</p>';
            return;
        }

        carsList.innerHTML = event.cars.map(car => `
            <div class="car-item">
                <h3>${car.carModel} - ${car.driverName}</h3>
                <div class="seat-info">
                    <span class="seat-count">${car.availableSeats - car.occupiedSeats} seats available</span>
                    <button onclick="app.bookSeat(${car.id})" ${car.availableSeats - car.occupiedSeats === 0 ? 'disabled' : ''}>
                        Book Seat
                    </button>
                </div>
                ${car.passengers.length > 0 ? `
                    <div class="passengers">
                        <strong>Passengers:</strong>
                        <ul>
                            ${car.passengers.map((passenger, index) => `
                                <li>
                                    <span>${passenger}</span>
                                    <button onclick="app.freeSeat(${car.id}, ${index})" class="free-seat-btn" title="Free this seat">
                                        ✕
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Book a seat in a specific car
    bookSeat(carId) {
        const passengerName = prompt('Enter your name:');
        if (!passengerName || !passengerName.trim()) {
            this.showMessage('Please enter a valid name', 'error');
            return;
        }

        const event = this.events[this.currentEventId];
        const car = event.cars.find(c => c.id === carId);

        if (car && car.availableSeats > car.occupiedSeats) {
            car.passengers.push(passengerName.trim());
            car.occupiedSeats++;
            this.saveEvents();
            this.displayCars();
            this.showMessage(`Seat booked for ${passengerName.trim()}!`, 'success');
        } else {
            this.showMessage('No seats available in this car.', 'error');
        }
    }

    // Free a seat in a specific car
    freeSeat(carId, passengerIndex) {
        const event = this.events[this.currentEventId];
        const car = event.cars.find(c => c.id === carId);
        
        if (car && car.passengers[passengerIndex]) {
            const passengerName = car.passengers[passengerIndex];
            
            // Confirm the action
            if (confirm(`Are you sure you want to free the seat for ${passengerName}?`)) {
                // Remove passenger and decrease occupied seats
                car.passengers.splice(passengerIndex, 1);
                car.occupiedSeats--;
                
                // Save changes
                this.saveEvents();
                this.displayCars();
                this.showMessage(`Seat freed for ${passengerName}`, 'success');
            }
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
        
        // Hide all sections
        document.getElementById('event-details').classList.add('hidden');
        document.getElementById('car-registration').classList.add('hidden');
        document.getElementById('event-view').classList.add('hidden');
        
        // Show create event and join event
        document.getElementById('create-event').classList.remove('hidden');
        document.getElementById('join-event').classList.remove('hidden');
        
        // Clear forms
        document.getElementById('event-form').reset();
        document.getElementById('car-form').reset();
        document.getElementById('join-form').reset();
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-date').value = today;
        
        this.clearFieldErrors();
    }

    // Copy event link to clipboard
    copyEventLink() {
        const shareUrl = document.getElementById('share-url');
        shareUrl.select();
        document.execCommand('copy');
        this.showMessage('Event link copied to clipboard!', 'success');
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
}

    // Initialize the app when page loads
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new GroupRideApp();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-date').value = today;
        
        // Check if there's an event ID in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event');
        
        if (eventId && window.app.events[eventId]) {
            window.app.currentEventId = eventId;
            window.app.displayEventView();
        }
    });
