// Simple internationalization (i18n) system
// This file manages translations for different languages

// Translation data for all supported languages
const translations = {
    en: {
        // Header
        appTitle: "GroupRide",
        appSubtitle: "Share rides, save money, make friends, don't forget a child!",
        
        // Event Creation
        createNewEvent: "Create New Event",
        eventName: "Event Name:",
        eventDescription: "Event Description:",
        date: "Date:",
        time: "Time:",
        labelEventPassword: "Event Password (optional):",
        placeholderEventPassword: "Password to protect event editing",
        eventPasswordHint: "If set, this password will be required to edit the event later.",
        createEvent: "Create Event",
        
        // Car Registration
        registerYourCar: "Register Your Car",
        addAnotherCar: "Add Another Car",
        addCarDescription: "Add your car to this event. You can register multiple cars if needed.",
        driverName: "Driver Name:",
        driverPhone: "Driver Phone:",
        driverEmail: "Driver Email:",
        carModel: "Car Model:",
        availableSeats: "Available Seats:",
        pickupAddress: "Pickup Address (optional)",
        dropoffAddress: "Drop-off Address (optional)",
        requirePin: "Require PIN to assign riders to this car",
        setPin: "Set a PIN (share with trusted drivers):",
        pinHint: "Leave unchecked to keep seats open for anyone.",
        registerCar: "Register Car",
        cancel: "Cancel",
        carRegistrationNote: "💡 You can register multiple cars for this event. Each car will be listed separately.",
        
        // Join Event
        joinExistingEvent: "Join Existing Event",
        eventIdOrUrl: "Event ID or URL:",
        joinEvent: "Join Event",
        
        // Edit Event
        editEvent: "Edit Event",
        actionDeleteEvent: "Delete Event",
        saveChanges: "Save Changes",
        
        // Event View
        backToCreate: "← Create New Event",
        eventId: "Event ID:",
        copy: "Copy",
        noCarsRegistered: "No cars registered yet",
        beFirstToRegister: "Be the first to register your car!",
        registerFirstCar: "Register First Car",
        availableCars: "Available Cars",
        totalSeats: "total seats",
        occupied: "occupied",
        available: "available",
        addCar: "Add Car",
        car: "Car",
        driver: "Driver",
        pinRequired: "PIN required",
        openSeats: "Open seats",
        freeSeats: "free seat",
        freeSeatsPlural: "free seats",
        remove: "Remove",
        pickup: "Pickup:",
        dropoff: "Drop-off:",
        
        // Ride Requests
        rideRequests: "Ride Requests",
        noRidersWaiting: "No riders waiting",
        ridersWaiting: "rider(s) waiting",
        noRideRequests: "No ride requests yet.",
        needARide: "Need a Ride?",
        rideRequestHelper: "Share your contact info, then list everyone who needs a ride. Add as many names as you need.",
        contactName: "Contact Name",
        labelContactAlsoNeedsRide: "I also need a ride (add me to passenger list)",
        contactPhone: "Contact Phone (optional)",
        notesForDrivers: "Notes for drivers (optional)",
        passengerNames: "Passenger Names",
        addAnotherRider: "+ Add another rider",
        requestRide: "Request Ride",
        save: "Save",
        clear: "Clear",
        phone: "Phone:",
        notes: "Notes:",
        noRidersListed: "No riders listed yet.",
        waiting: "Waiting",
        assigned: "Assigned",
        selectACar: "Select a car",
        assign: "Assign",
        removeRequest: "Remove Request",
        assignedTo: "Assigned to",
        noCarsWithFreeSeats: "No cars with free seats yet.",
        
        // Modals
        bookASeat: "Book a Seat",
        enterNameToBook: "Enter your name to book this seat:",
        bookSeat: "Book Seat",
        confirmAction: "Confirm Action",
        areYouSure: "Are you sure you want to proceed?",
        yesContinue: "Yes, Continue",
        enterCarPin: "Enter Car PIN",
        pinProtectedMessage: "This car is protected. Enter the PIN shared by the driver.",
        titleEnterEventPassword: "Enter Event Password",
        msgEventPasswordRequired: "This event is protected. Enter the password to edit it.",
        incorrectEventPassword: "Incorrect password. Please try again.",
        pin: "PIN",
        submit: "Submit",
        enterPinFor: "Enter PIN for",
        
        // Messages
        eventCreatedSuccess: "Event created successfully!",
        eventUpdatedSuccess: "Event updated successfully!",
        eventDeletedSuccess: "Event deleted successfully!",
        carRegisteredSuccess: "Car registered successfully!",
        carUpdatedSuccess: "Car updated successfully!",
        rideRequestPosted: "Ride request posted!",
        seatBooked: "Seat booked for",
        seatFreed: "Seat freed for",
        assignedToCar: "assigned to",
        eventLinkCopied: "Event link copied to clipboard!",
        failedToCopy: "Failed to copy link. Please copy manually:",
        
        // Errors
        eventNameRequired: "Event name is required",
        eventDateRequired: "Event date is required",
        eventTimeRequired: "Event time is required",
        eventDatePast: "Event date cannot be in the past",
        driverNameRequired: "Driver name is required",
        carModelRequired: "Car model is required",
        seatsRequired: "Please enter 1-8 seats",
        pinMinLength: "PIN must be at least 4 characters",
        contactNameRequired: "Contact name is required.",
        addRiderName: "Add at least one rider name before submitting.",
        invalidEventId: "Invalid event ID or URL format.",
        eventNotFound: "Event not found. Please check the Event ID or URL.",
        noEventToEdit: "No event to edit!",
        createOrJoinFirst: "Please create or join an event first!",
        joinOrCreateFirst: "Join or create an event before asking for a ride.",
        selectCarBeforeAssign: "Select a car before assigning.",
        chooseCarBeforeAssign: "Choose a car before assigning.",
        riderNotFound: "Rider not found.",
        carNotFound: "Car not found.",
        noSeatsAvailable: "No seats available in that car.",
        noSeatsAvailableThisCar: "No seats available in this car.",
        enterPin: "Please enter the PIN.",
        incorrectPin: "Incorrect PIN. Please try again.",
        enterValidName: "Please enter a valid name",
        carRequiresPin: "This car requires a PIN. Please try booking again.",
        enterPinBeforeAssign: "Enter the PIN before assigning riders to this car.",
        enterPinToBook: "Enter the PIN to book a seat in this car.",
        eventPasswordRequiredError: "Please enter the password.",
        
        // Confirmations
        removeRideRequest: "Remove Ride Request",
        removeRideRequestConfirm: "Remove the ride request from",
        removeRider: "Remove Rider",
        removeRiderConfirm: "Remove",
        freeSeat: "Free Seat",
        freeSeatConfirm: "Are you sure you want to free the seat for",
        removeCar: "Remove Car",
        removeCarConfirm: "Are you sure you want to remove",
        removeCarWithPassengers: "This will also remove all",
        passenger: "passenger(s) from this car.",
        editCar: "Edit Car",
        edit: "Edit",
        moreOptions: "More options",
        updateCar: "Update Car",
        enterPinToRemove: "Enter the PIN to remove this car.",
        enterPinToEdit: "Enter the PIN to edit this car.",
        
        // Generic errors
        failedToCreateEvent: "Failed to create event. Please try again.",
        failedToUpdateEvent: "Failed to update event. Please try again.",
        failedToLoadEvent: "Failed to load event. Please try again.",
        failedToDeleteEvent: "Failed to delete event. Please try again.",
        deleteEventConfirm: "Are you sure you want to delete this event? This will permanently delete the event and all associated cars, ride requests, and passengers. This action cannot be undone.",
        failedToRegisterCar: "Failed to register car. Please try again.",
        failedToLoadCars: "Failed to load cars. Please try again.",
        failedToPostRideRequest: "Failed to post ride request. Please try again.",
        failedToLoadRideRequests: "Failed to load ride requests. Please try again.",
        failedToAssignRider: "Failed to assign rider. Please try again.",
        failedToBookSeat: "Failed to book seat. Please try again.",
        failedToFreeSeat: "Failed to free seat. Please try again.",
        failedToRemoveCar: "Failed to remove car. Please try again.",
        failedToEditCar: "Failed to edit car. Please try again.",
        failedToCompleteAction: "Failed to complete action. Please try again.",
        couldNotVerifyPin: "Could not verify PIN. Please try again.",
        couldNotStartBooking: "Could not start booking. Please try again.",
        
        // Placeholders
        placeholderEventName: "e.g., Company Meeting",
        placeholderEventDescription: "e.g., Soccer practice pickup.",
        placeholderYourName: "Your name",
        placeholderPhone: "Your phone number",
        placeholderEmail: "Your email address",
        placeholderCarModel: "e.g., Toyota Camry",
        placeholderAddress: "e.g., 123 Main St, City, State",
        placeholderContactName: "e.g., Sam Carter",
        placeholderPhoneNumber: "e.g., +1 555 123 4567",
        placeholderNotes: "e.g., Child seat needed.",
        placeholderPassengerName: "Passenger name",
        placeholderPin: "Enter 4-12 characters",
        
        // Language
        language: "Language"
    },
    
    fr: {
        // Header
        appTitle: "GroupRide",
        appSubtitle: "Partagez des trajets, économisez de l'argent, faites vous des amis, n'oubliez pas un enfant !",
        
        // Event Creation
        createNewEvent: "Créer un nouvel événement",
        eventName: "Nom de l'événement :",
        eventDescription: "Description de l'événement :",
        date: "Date :",
        time: "Heure :",
        labelEventPassword: "Mot de passe de l'événement (optionnel) :",
        placeholderEventPassword: "Mot de passe pour protéger l'édition de l'événement",
        eventPasswordHint: "Si défini, ce mot de passe sera requis pour modifier l'événement plus tard.",
        createEvent: "Créer l'événement",
        
        // Car Registration
        registerYourCar: "Enregistrer votre voiture",
        addAnotherCar: "Ajouter une autre voiture",
        addCarDescription: "Ajoutez votre voiture à cet événement. Vous pouvez enregistrer plusieurs voitures si nécessaire.",
        driverName: "Nom du conducteur :",
        driverPhone: "Téléphone du conducteur :",
        driverEmail: "Email du conducteur :",
        carModel: "Modèle de voiture :",
        availableSeats: "Places disponibles :",
        pickupAddress: "Adresse de prise en charge (optionnel)",
        dropoffAddress: "Adresse de dépose (optionnel)",
        requirePin: "Exiger un code PIN pour assigner des passagers à cette voiture",
        setPin: "Définir un code PIN (partager avec les conducteurs de confiance) :",
        pinHint: "Laissez décoché pour garder les places ouvertes à tous.",
        registerCar: "Enregistrer la voiture",
        cancel: "Annuler",
        carRegistrationNote: "💡 Vous pouvez enregistrer plusieurs voitures pour cet événement. Chaque voiture sera listée séparément.",
        
        // Join Event
        joinExistingEvent: "Rejoindre un événement existant",
        eventIdOrUrl: "ID d'événement ou URL :",
        joinEvent: "Rejoindre l'événement",
        
        // Edit Event
        editEvent: "Modifier l'événement",
        actionDeleteEvent: "Supprimer l'événement",
        saveChanges: "Enregistrer les modifications",
        
        // Event View
        backToCreate: "← Créer un nouvel événement",
        eventId: "ID de l'événement :",
        copy: "Copier",
        noCarsRegistered: "Aucune voiture enregistrée pour le moment",
        beFirstToRegister: "Soyez le premier à enregistrer votre voiture !",
        registerFirstCar: "Enregistrer la première voiture",
        availableCars: "Voitures disponibles",
        totalSeats: "places au total",
        occupied: "occupées",
        available: "disponibles",
        addCar: "Ajouter une voiture",
        car: "Voiture",
        driver: "Conducteur",
        pinRequired: "Code PIN requis",
        openSeats: "Places libres",
        freeSeats: "place libre",
        freeSeatsPlural: "places libres",
        remove: "Retirer",
        pickup: "Prise en charge :",
        dropoff: "Dépose :",
        
        // Ride Requests
        rideRequests: "Demandes de trajet",
        noRidersWaiting: "Aucun passager en attente",
        ridersWaiting: "passager(s) en attente",
        noRideRequests: "Aucune demande de trajet pour le moment.",
        needARide: "Besoin d'un trajet ?",
        rideRequestHelper: "Partagez vos informations de contact, puis listez tous ceux qui ont besoin d'un trajet. Ajoutez autant de noms que nécessaire.",
        contactName: "Nom du contact",
        labelContactAlsoNeedsRide: "J'ai aussi besoin d'un trajet (m'ajouter à la liste des passagers)",
        contactPhone: "Téléphone du contact (optionnel)",
        notesForDrivers: "Notes pour les conducteurs (optionnel)",
        passengerNames: "Noms des passagers",
        addAnotherRider: "+ Ajouter un autre passager",
        requestRide: "Demander un trajet",
        save: "Enregistrer",
        clear: "Effacer",
        phone: "Téléphone :",
        notes: "Notes :",
        noRidersListed: "Aucun passager listé pour le moment.",
        waiting: "En attente",
        assigned: "Assigné",
        selectACar: "Sélectionner une voiture",
        assign: "Assigner",
        removeRequest: "Retirer la demande",
        assignedTo: "Assigné à",
        noCarsWithFreeSeats: "Aucune voiture avec des places libres pour le moment.",
        
        // Modals
        bookASeat: "Réserver une place",
        enterNameToBook: "Entrez votre nom pour réserver cette place :",
        bookSeat: "Réserver la place",
        confirmAction: "Confirmer l'action",
        areYouSure: "Êtes-vous sûr de vouloir continuer ?",
        yesContinue: "Oui, continuer",
        enterCarPin: "Entrer le code PIN de la voiture",
        pinProtectedMessage: "Cette voiture est protégée. Entrez le code PIN partagé par le conducteur.",
        titleEnterEventPassword: "Entrer le mot de passe de l'événement",
        msgEventPasswordRequired: "Cet événement est protégé. Entrez le mot de passe pour le modifier.",
        incorrectEventPassword: "Mot de passe incorrect. Veuillez réessayer.",
        pin: "Code PIN",
        submit: "Soumettre",
        enterPinFor: "Entrer le code PIN pour",
        
        // Messages
        eventCreatedSuccess: "Événement créé avec succès !",
        eventUpdatedSuccess: "Événement mis à jour avec succès !",
        eventDeletedSuccess: "Événement supprimé avec succès !",
        carRegisteredSuccess: "Voiture enregistrée avec succès !",
        carUpdatedSuccess: "Voiture mise à jour avec succès !",
        rideRequestPosted: "Demande de trajet publiée !",
        seatBooked: "Place réservée pour",
        seatFreed: "Place libérée pour",
        assignedToCar: "assigné à",
        eventLinkCopied: "Lien de l'événement copié dans le presse-papiers !",
        failedToCopy: "Échec de la copie du lien. Veuillez copier manuellement :",
        
        // Errors
        eventNameRequired: "Le nom de l'événement est requis",
        eventDateRequired: "La date de l'événement est requise",
        eventTimeRequired: "L'heure de l'événement est requise",
        eventDatePast: "La date de l'événement ne peut pas être dans le passé",
        driverNameRequired: "Le nom du conducteur est requis",
        carModelRequired: "Le modèle de voiture est requis",
        seatsRequired: "Veuillez entrer 1-8 places",
        pinMinLength: "Le code PIN doit contenir au moins 4 caractères",
        contactNameRequired: "Le nom du contact est requis.",
        addRiderName: "Ajoutez au moins un nom de passager avant de soumettre.",
        invalidEventId: "Format d'ID d'événement ou d'URL invalide.",
        eventNotFound: "Événement introuvable. Veuillez vérifier l'ID d'événement ou l'URL.",
        noEventToEdit: "Aucun événement à modifier !",
        createOrJoinFirst: "Veuillez d'abord créer ou rejoindre un événement !",
        joinOrCreateFirst: "Rejoignez ou créez un événement avant de demander un trajet.",
        selectCarBeforeAssign: "Sélectionnez une voiture avant d'assigner.",
        chooseCarBeforeAssign: "Choisissez une voiture avant d'assigner.",
        riderNotFound: "Passager introuvable.",
        carNotFound: "Voiture introuvable.",
        noSeatsAvailable: "Aucune place disponible dans cette voiture.",
        noSeatsAvailableThisCar: "Aucune place disponible dans cette voiture.",
        enterPin: "Veuillez entrer le code PIN.",
        incorrectPin: "Code PIN incorrect. Veuillez réessayer.",
        enterValidName: "Veuillez entrer un nom valide",
        carRequiresPin: "Cette voiture nécessite un code PIN. Veuillez réessayer de réserver.",
        enterPinBeforeAssign: "Entrez le code PIN avant d'assigner des passagers à cette voiture.",
        enterPinToBook: "Entrez le code PIN pour réserver une place dans cette voiture.",
        eventPasswordRequiredError: "Veuillez entrer le mot de passe.",
        
        // Confirmations
        removeRideRequest: "Retirer la demande de trajet",
        removeRideRequestConfirm: "Retirer la demande de trajet de",
        removeRider: "Retirer le passager",
        removeRiderConfirm: "Retirer",
        freeSeat: "Libérer la place",
        freeSeatConfirm: "Êtes-vous sûr de vouloir libérer la place pour",
        removeCar: "Retirer la voiture",
        removeCarConfirm: "Êtes-vous sûr de vouloir retirer",
        removeCarWithPassengers: "Cela retirera également tous les",
        passenger: "passager(s) de cette voiture.",
        editCar: "Modifier la voiture",
        edit: "Modifier",
        moreOptions: "Plus d'options",
        updateCar: "Mettre à jour la voiture",
        enterPinToRemove: "Entrez le code PIN pour retirer cette voiture.",
        enterPinToEdit: "Entrez le code PIN pour modifier cette voiture.",
        
        // Generic errors
        failedToCreateEvent: "Échec de la création de l'événement. Veuillez réessayer.",
        failedToUpdateEvent: "Échec de la mise à jour de l'événement. Veuillez réessayer.",
        failedToLoadEvent: "Échec du chargement de l'événement. Veuillez réessayer.",
        failedToDeleteEvent: "Échec de la suppression de l'événement. Veuillez réessayer.",
        deleteEventConfirm: "Êtes-vous sûr de vouloir supprimer cet événement ? Cela supprimera définitivement l'événement et toutes les voitures, demandes de trajet et passagers associés. Cette action ne peut pas être annulée.",
        failedToRegisterCar: "Échec de l'enregistrement de la voiture. Veuillez réessayer.",
        failedToLoadCars: "Échec du chargement des voitures. Veuillez réessayer.",
        failedToPostRideRequest: "Échec de la publication de la demande de trajet. Veuillez réessayer.",
        failedToLoadRideRequests: "Échec du chargement des demandes de trajet. Veuillez réessayer.",
        failedToAssignRider: "Échec de l'assignation du passager. Veuillez réessayer.",
        failedToBookSeat: "Échec de la réservation de la place. Veuillez réessayer.",
        failedToFreeSeat: "Échec de la libération de la place. Veuillez réessayer.",
        failedToRemoveCar: "Échec du retrait de la voiture. Veuillez réessayer.",
        failedToEditCar: "Échec de la modification de la voiture. Veuillez réessayer.",
        failedToCompleteAction: "Échec de l'action. Veuillez réessayer.",
        couldNotVerifyPin: "Impossible de vérifier le code PIN. Veuillez réessayer.",
        couldNotStartBooking: "Impossible de démarrer la réservation. Veuillez réessayer.",
        
        // Placeholders
        placeholderEventName: "ex. : Réunion d'entreprise",
        placeholderEventDescription: "ex. : Récupération après l'entraînement de football.",
        placeholderYourName: "Votre nom",
        placeholderPhone: "Votre numéro de téléphone",
        placeholderEmail: "Votre adresse email",
        placeholderCarModel: "ex. : Toyota Camry",
        placeholderAddress: "ex. : 123 Rue Principale, Ville, État",
        placeholderContactName: "ex. : Jean Dupont",
        placeholderPhoneNumber: "ex. : +33 1 23 45 67 89",
        placeholderNotes: "ex. : Siège enfant nécessaire.",
        placeholderPassengerName: "Nom du passager",
        placeholderPin: "Entrez 4-12 caractères",
        
        // Language
        language: "Langue"
    }
};

// Current language (defaults to browser language or English)
let currentLanguage = localStorage.getItem('language') || 
    (navigator.language.startsWith('fr') ? 'fr' : 'en');

// Function to get a translated string
function t(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

// Function to change language
function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        updatePageLanguage();
        return true;
    }
    return false;
}

// Function to get current language
function getLanguage() {
    return currentLanguage;
}

// Function to update page language (called when language changes)
function updatePageLanguage() {
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            if (element.tagName === 'INPUT' && element.type !== 'submit' && element.type !== 'button') {
                // For input placeholders
                if (element.hasAttribute('data-i18n-placeholder')) {
                    const placeholderKey = element.getAttribute('data-i18n-placeholder');
                    element.placeholder = t(placeholderKey);
                }
            } else if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                element.value = t(key);
            } else if (element.tagName === 'BUTTON') {
                // Explicitly handle BUTTON elements
                element.textContent = t(key);
            } else if (element.tagName === 'TEXTAREA') {
                // For textarea placeholders
                if (element.hasAttribute('data-i18n-placeholder')) {
                    const placeholderKey = element.getAttribute('data-i18n-placeholder');
                    element.placeholder = t(placeholderKey);
                }
            } else {
                element.textContent = t(key);
            }
        }
    });
    
    // Update placeholders separately
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
            element.placeholder = t(key);
        }
    });
    
    // Update title
    document.title = t('appTitle') + ' - ' + (currentLanguage === 'fr' ? 'Covoiturage simplifié' : 'Carpooling Made Easy');
    
    // Trigger custom event for app to update dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

// Make functions globally available
window.t = t;
window.setLanguage = setLanguage;
window.getLanguage = getLanguage;
window.updatePageLanguage = updatePageLanguage;

// Export for use in other files (Node.js compatibility)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { t, setLanguage, getLanguage, updatePageLanguage };
}

