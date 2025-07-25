import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
    import {
      getDatabase,
      ref,
      update,
      push,
      set,
      child,
      onValue,
      get
    } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

    // Firebase Config for Bus Database (Read)
    const readFirebaseConfig = {
      apiKey: "AIzaSyB3Z4smm1Mfl0X9xehIn0K1_hfuezB3mBw",
      authDomain: "busticketsystem-c4115.firebaseapp.com",
      databaseURL: "https://busticketsystem-c4115-default-rtdb.firebaseio.com",
      projectId: "busticketsystem-c4115",
      storageBucket: "busticketsystem-c4115.appspot.com",
      messagingSenderId: "780835175059",
      appId: "1:780835175059:web:f78299bdd6e73213906b66"
    };

    // Firebase Config for Passenger Database (Write)
    const writeFirebaseConfig = {
      apiKey: "AIzaSyCu5xVwvfFBKhar_ASjj9XDFiyg5voVt0U",
      authDomain: "passengersbussystem.firebaseapp.com",
      databaseURL: "https://passengersbussystem-default-rtdb.firebaseio.com",
      projectId: "passengersbussystem",
      storageBucket: "passengersbussystem.firebasestorage.app",
      messagingSenderId: "989554274702",
      appId: "1:989554274702:web:59e73c5435bc6d341574df"
    };

    // Initialize Firebase apps
    const readApp = initializeApp(readFirebaseConfig, "readApp");
    const writeApp = initializeApp(writeFirebaseConfig, "writeApp");

    const readDb = getDatabase(readApp);
    const writeDb = getDatabase(writeApp);

    let allBuses = {};
    let currentFrom = "";
    let currentTo = "";

    // Display all buses on page load
    function displayAllBuses() {
      const resultsContainer = document.getElementById("results");
      resultsContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading buses from database...</p></div>';
      
      const busesRef = ref(readDb, "/");
      
      onValue(busesRef, (snapshot) => {
        if (!snapshot.exists()) {
          resultsContainer.innerHTML = '<div class="no-results"><i class="fas fa-bus-slash"></i><p>No buses available in database.</p></div>';
          return;
        }

        allBuses = snapshot.val();
        renderBuses(allBuses);
      }, (error) => {
        console.error("Firebase error:", error);
        resultsContainer.innerHTML = `<div class="no-results"><i class="fas fa-exclamation-triangle"></i><p>Error connecting to database: ${error.message}</p></div>`;
      });
    }

    // Render buses in the UI
    function renderBuses(buses) {
      const resultsContainer = document.getElementById("results");
      resultsContainer.innerHTML = "";
      
      let busCount = 0;
      
      for (let id in buses) {
        const bus = buses[id];
        
        if (!bus.from || !bus.to || bus.seats <= 0) {
          continue;
        }
        
        busCount++;
        
        const formattedTime = formatTime(bus.time);
        
        const busCard = document.createElement("div");
        busCard.className = "bus-card";
        busCard.setAttribute("data-bus-id", id);
        busCard.innerHTML = `
          <div class="bus-header">
            <div class="bus-route">${bus.from} ➝ ${bus.to}</div>
            <div class="bus-time">${formattedTime}</div>
          </div>
          <div class="bus-body">
            <div class="bus-info">
              <div class="info-item">
                <div class="info-label">Bus ID</div>
                <div class="info-value">${id}</div>
              </div>
              <div class="info-item seats-available">
                <div class="info-label">Available Seats</div>
                <div class="info-value seats-count">${bus.seats}</div>
              </div>
            </div>
            <button class="book-btn" id="book-${id}">Book Now <i class="fas fa-ticket-alt"></i></button>
          </div>
          <div id="form-${id}" class="booking-form hidden-form">
            <h3 class="form-title"><i class="fas fa-edit"></i> Passenger Details</h3>
            <div class="form-row">
              <div class="form-group-flex">
                <label for="name-${id}"><i class="fas fa-user"></i> Full Name</label>
                <input type="text" id="name-${id}" placeholder="Your Full Name" required>
              </div>
              <div class="form-group-flex">
                <label for="phone-${id}"><i class="fas fa-phone"></i> Phone Number</label>
                <input type="tel" id="phone-${id}" placeholder="Phone Number" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group-flex">
                <label for="email-${id}"><i class="fas fa-envelope"></i> Email</label>
                <input type="email" id="email-${id}" placeholder="Email Address" required>
              </div>
              <div class="form-group-flex">
                <label for="nationalId-${id}"><i class="fas fa-id-card"></i> National ID</label>
                <input type="text" id="nationalId-${id}" placeholder="National ID" required>
              </div>
            </div>
            <div class="form-buttons">
              <button class="confirm-btn" id="confirm-${id}"><i class="fas fa-check"></i> Confirm Booking</button>
              <button class="cancel-btn" id="cancel-${id}"><i class="fas fa-times"></i> Cancel</button>
            </div>
          </div>
        `;
        
        resultsContainer.appendChild(busCard);

        // Add event listeners
        setupBusEventListeners(id, bus.seats);
      }
      
      if (busCount === 0) {
        resultsContainer.innerHTML = '<div class="no-results"><i class="fas fa-bus-slash"></i><p>No buses available with seats.</p></div>';
      }
    }

    // Setup event listeners for each bus
    function setupBusEventListeners(busId, initialSeats) {
      const bookBtn = document.getElementById(`book-${busId}`);
      const confirmBtn = document.getElementById(`confirm-${busId}`);
      const cancelBtn = document.getElementById(`cancel-${busId}`);
      
      if (bookBtn) {
        bookBtn.addEventListener("click", () => showBookingForm(busId));
      }
      
      if (confirmBtn) {
        confirmBtn.addEventListener("click", () => confirmBooking(busId, initialSeats));
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => hideBookingForm(busId));
      }
    }

    // Search and filter buses
    window.searchBuses = function () {
      const fromInput = document.getElementById("fromInput");
      const toInput = document.getElementById("toInput");
      
      if (!fromInput || !toInput) return;
      
      currentFrom = fromInput.value.trim().toLowerCase();
      currentTo = toInput.value.trim().toLowerCase();
      
      // If fields are empty, show all buses
      if (!currentFrom && !currentTo) {
        renderBuses(allBuses);
        return;
      }

      // Filter buses
      const filteredBuses = {};
      let matchCount = 0;
      
      for (let id in allBuses) {
        const bus = allBuses[id];
        const busFrom = bus.from ? bus.from.toLowerCase() : "";
        const busTo = bus.to ? bus.to.toLowerCase() : "";
        
        const fromMatch = !currentFrom || busFrom.includes(currentFrom);
        const toMatch = !currentTo || busTo.includes(currentTo);
        
        if (fromMatch && toMatch && bus.seats > 0) {
          filteredBuses[id] = bus;
          matchCount++;
        }
      }
      
      renderBuses(filteredBuses);
      
      // Add search info message
      const resultsContainer = document.getElementById("results");
      if (matchCount > 0) {
        const searchInfo = document.createElement("div");
        searchInfo.className = "search-info";
        searchInfo.innerHTML = `<i class="fas fa-info-circle"></i> Found ${matchCount} buses matching your search`;
        resultsContainer.insertBefore(searchInfo, resultsContainer.firstChild);
      }
    };

    // Clear search and show all buses
    window.clearSearch = function () {
      document.getElementById("fromInput").value = "";
      document.getElementById("toInput").value = "";
      currentFrom = "";
      currentTo = "";
      renderBuses(allBuses);
    };

    // Show booking form
    function showBookingForm(busId) {
      const formEl = document.getElementById(`form-${busId}`);
      const bookBtn = document.getElementById(`book-${busId}`);
      
      if (formEl && bookBtn) {
        formEl.classList.remove("hidden-form");
        bookBtn.style.display = "none";
      }
    }

    // Hide booking form
    function hideBookingForm(busId) {
      const formEl = document.getElementById(`form-${busId}`);
      const bookBtn = document.getElementById(`book-${busId}`);
      const nameInput = document.getElementById(`name-${busId}`);
      const phoneInput = document.getElementById(`phone-${busId}`);
      
      if (formEl && bookBtn) {
        formEl.classList.add("hidden-form");
        bookBtn.style.display = "block";
        
        // Clear data
        if (nameInput) nameInput.value = "";
        if (phoneInput) phoneInput.value = "";
      }
    }

    // Confirm booking
    async function confirmBooking(busId, seatsAvailable) {
      const nameInput = document.getElementById(`name-${busId}`);
      const phoneInput = document.getElementById(`phone-${busId}`);
      const emailInput = document.getElementById(`email-${busId}`);
      const nationalIdInput = document.getElementById(`nationalId-${busId}`);
      const confirmBtn = document.getElementById(`confirm-${busId}`);

      if (!nameInput || !phoneInput || !emailInput || !nationalIdInput || !confirmBtn) return;

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const email = emailInput.value.trim();
      const nationalId = nationalIdInput.value.trim();

      if (!name || !phone || !email || !nationalId) {
        alert("Please fill in all passenger details.");
        return;
      }

      if (phone.length < 10) {
        alert("Please enter a valid phone number.");
        return;
      }

      if (nationalId.length < 14) {
        alert("Please enter a valid 14-digit National ID.");
        return;
      }

      // Get current seats
      const currentSeats = parseInt(document.querySelector(`[data-bus-id="${busId}"] .seats-count`).textContent);
      
      if (currentSeats <= 0) {
        alert("This bus is already full.");
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';

      try {
        const newCount = currentSeats - 1;

        // Update bus seats in the read database
        await update(ref(readDb, `${busId}`), {
          seats: newCount
        });

        // Generate passenger ID
        const passengerId = `PASS${Math.floor(1000 + Math.random() * 9000)}`;
        
        // Create passenger data
        const passengerData = {
          name: name,
          phone: phone,
          email: email,
          nationalId: nationalId,
          registrationDate: new Date().toISOString().split('T')[0]
        };

        // Generate booking ID
        const bookingId = `BOOK${Math.floor(1000 + Math.random() * 9000)}`;
        
        // Create booking data
        const bookingData = {
          busId: busId,
          destination: `${allBuses[busId].from} → ${allBuses[busId].to}`,
          departureTime: allBuses[busId].time,
          seatNumber: Math.floor(Math.random() * 50) + 1, // Random seat assignment
          bookingDate: new Date().toISOString().split('T')[0]
        };

        // Save passenger data to write database
        await set(ref(writeDb, `passengers/${passengerId}`), passengerData);
        
        // Save booking data under passenger
        await set(ref(writeDb, `passengers/${passengerId}/bookings/${bookingId}`), bookingData);

        // Success message
        alert(`✅ Booking confirmed!\n\n🎫 Booking ID: ${bookingId}\n👤 Passenger ID: ${passengerId}\n🚌 Route: ${bookingData.destination}\n📱 Phone: ${phone}`);
        
        // Update UI
        document.querySelector(`[data-bus-id="${busId}"] .seats-count`).textContent = newCount;
        allBuses[busId].seats = newCount;
        
        // Hide form
        hideBookingForm(busId);
        
        // Update bus card if no seats left
        if (newCount <= 0) {
          const busCard = document.querySelector(`[data-bus-id="${busId}"]`);
          busCard.style.opacity = "0.7";
          busCard.querySelector('.book-btn').disabled = true;
          busCard.querySelector('.book-btn').textContent = "Sold Out";
          busCard.querySelector('.book-btn').style.background = "#95a5a6";
        }
        
      } catch (error) {
        console.error("Booking error:", error);
        alert("Booking failed. Please try again.");
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Booking';
      }
    }

    // Format time
    function formatTime(timeString) {
      if (!timeString) return 'Not specified';
      
      try {
        const date = new Date(timeString);
        return date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return timeString;
      }
    }

    // Initialize app
    document.addEventListener('DOMContentLoaded', function() {
      displayAllBuses();
    });

    // Add sample bus data for testing
    window.addSampleBusData = async function() {
      const sampleBuses = {
        "BUS001": { "from": "Alexandria", "to": "Cairo", "time": "2025-07-30T08:00", "seats": 40 },
        "BUS002": { "from": "Cairo", "to": "Hurghada", "time": "2025-07-30T10:30", "seats": 45 },
        "BUS003": { "from": "Tanta", "to": "Alexandria", "time": "2025-07-30T12:15", "seats": 35 },
        "BUS004": { "from": "Mansoura", "to": "Cairo", "time": "2025-07-30T14:00", "seats": 50 },
        "BUS005": { "from": "Cairo", "to": "Ismailia", "time": "2025-07-30T16:45", "seats": 42 }
      };

      try {
        await set(ref(readDb), sampleBuses);
        alert("Sample bus data added successfully to bus database!");
        displayAllBuses();
      } catch (error) {
        console.error("Error adding sample bus data:", error);
        alert("Failed to add sample bus data.");
      }
    }

    // Add sample passenger data for testing
    window.addSamplePassengerData = async function() {
      const samplePassenger = {
        "PASS001": {
          "name": "Ahmed Ali",
          "phone": "+201234567890",
          "email": "ahmed.ali@example.com",
          "nationalId": "29801011234567",
          "registrationDate": "2025-07-25",
          "bookings": {
            "BOOK001": {
              "busId": "BUS001",
              "destination": "Alexandria → Cairo",
              "departureTime": "2025-07-30T08:00:00",
              "seatNumber": 12,
              "bookingDate": "2025-07-24"
            }
          }
        }
      };

      try {
        await set(ref(writeDb, "passengers"), samplePassenger);
        alert("Sample passenger data added successfully to passenger database!");
      } catch (error) {
        console.error("Error adding sample passenger data:", error);
        alert("Failed to add sample passenger data.");
      }
    }

    window.clearSearch = clearSearch;