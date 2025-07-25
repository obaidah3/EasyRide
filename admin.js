import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const busesFirebaseConfig = {
  apiKey: "AIzaSyB3Z4smm1Mfl0X9xehIn0K1_hfuezB3mBw",
  authDomain: "busticketsystem-c4115.firebaseapp.com",
  databaseURL: "https://busticketsystem-c4115-default-rtdb.firebaseio.com",
  projectId: "busticketsystem-c4115",
  storageBucket: "busticketsystem-c4115.firebasestorage.app",
  messagingSenderId: "780835175059",
  appId: "1:780835175059:web:f78299bdd6e73213906b66"
};

const passengersFirebaseConfig = {
  apiKey: "AIzaSyCu5xVwvfFBKhar_ASjj9XDFiyg5voVt0U",
  authDomain: "passengersbussystem.firebaseapp.com",
  databaseURL: "https://passengersbussystem-default-rtdb.firebaseio.com",
  projectId: "passengersbussystem",
  storageBucket: "passengersbussystem.firebasestorage.app",
  messagingSenderId: "989554274702",
  appId: "1:989554274702:web:59e73c5435bc6d341574df"
};

let busesApp, passengersApp, busesDb, passengersDb;

try {
  busesApp = initializeApp(busesFirebaseConfig, 'buses');
  console.log('Bus database app initialized');
} catch (error) {
  console.error('Bus app init error:', error);
}

try {
  passengersApp = initializeApp(passengersFirebaseConfig, 'passengers');
  console.log('Passenger database app initialized');
} catch (error) {
  console.error('Passenger app init error:', error);
}

try {
  busesDb = getDatabase(busesApp);
  console.log('Bus database instance created');
} catch (error) {
  console.error('Bus database error:', error);
}

try {
  passengersDb = getDatabase(passengersApp);
  console.log('Passenger database instance created');
} catch (error) {
  console.error('Passenger database error:', error);
}

const busesRef = ref(busesDb);
const passengersRef = ref(passengersDb, "passengers");

let buses = {};
let passengers = {};
let bookings = {};
let currentEditType = '';
let currentEditId = '';

function getNextBusId() {
  const existingIds = Object.keys(buses).filter(id => id.startsWith('BUS'));
  if (existingIds.length === 0) {
    return 'BUS001';
  }
  
  const numbers = existingIds.map(id => parseInt(id.replace('BUS', '')));
  const maxNumber = Math.max(...numbers);
  const nextNumber = maxNumber + 1;
  
  return `BUS${nextNumber.toString().padStart(3, '0')}`;
}

function getNextPassengerId() {
  const existingIds = Object.keys(passengers).filter(id => id.startsWith('PASS'));
  if (existingIds.length === 0) {
    return 'PASS001';
  }
  
  const numbers = existingIds.map(id => parseInt(id.replace('PASS', '')));
  const maxNumber = Math.max(...numbers);
  const nextNumber = maxNumber + 1;
  
  return `PASS${nextNumber.toString().padStart(3, '0')}`;
}

function getNextBookingId() {
  const existingIds = Object.keys(bookings).filter(id => id.startsWith('BOOK'));
  if (existingIds.length === 0) {
    return 'BOOK001';
  }
  
  const numbers = existingIds.map(id => parseInt(id.replace('BOOK', '')));
  const maxNumber = Math.max(...numbers);
  const nextNumber = maxNumber + 1;
  
  return `BOOK${nextNumber.toString().padStart(3, '0')}`;
}

function init() {
  console.log('Initializing app...');
  
  testFirebaseConnection();
  
  initializeTabs();
  initializeModal();
  initializeForms();
  initializeSearch();
  loadData();
  
  const busesConnectedRef = ref(busesDb, ".info/connected");
  onValue(busesConnectedRef, (snap) => {
    console.log('Bus DB connection:', snap.val());
    const status = document.getElementById('connection-status');
    if (status) {
      if (snap.val() === true) {
        status.textContent = 'Connected - Buses DB';
        status.className = 'connection-status connected';
      } else {
        status.textContent = 'Disconnected - Buses DB';
        status.className = 'connection-status disconnected';
      }
    }
  });

  const passengersConnectedRef = ref(passengersDb, ".info/connected");
  onValue(passengersConnectedRef, (snap) => {
    console.log('Passenger DB connection:', snap.val());
    const status = document.getElementById('connection-status');
    if (status) {
      if (snap.val() === true) {
        status.textContent = 'Connected - Passengers DB';
        status.className = 'connection-status connected';
      } else {
        status.textContent = 'Disconnected - Passengers DB';
        status.className = 'connection-status disconnected';
      }
    }
  });
}

async function testFirebaseConnection() {
  console.log('Testing connection...');
  
  try {
    const busesTestRef = ref(busesDb, 'test');
    await set(busesTestRef, { timestamp: Date.now() });
    await remove(busesTestRef);
    console.log('Bus DB connection successful');
  } catch (error) {
    console.error('Bus DB connection failed:', error);
  }

  try {
    const passengersTestRef = ref(passengersDb, 'test');
    await set(passengersTestRef, { timestamp: Date.now() });
    await remove(passengersTestRef);
    console.log('Passenger DB connection successful');
  } catch (error) {
    console.error('Passenger DB connection failed:', error);
  }
}

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      showTab(tabName, button);
    });
  });
}

function showTab(tabName, buttonElement) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });

  const targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.classList.add('active');
    buttonElement.classList.add('active');
  }

  if (tabName === 'analytics') {
    updateAnalytics();
  }
}

function initializeModal() {
  const modal = document.getElementById('edit-modal');
  const closeBtn = document.querySelector('.close-btn');
  const cancelBtn = document.getElementById('cancel-edit');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  const editForm = document.getElementById('edit-form');
  if (editForm) {
    editForm.addEventListener('submit', handleEditSubmit);
  }
}

function closeModal() {
  const modal = document.getElementById('edit-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function initializeForms() {
  const busForm = document.getElementById('add-bus-form');
  if (busForm) {
    busForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const busId = getNextBusId();
      const busData = {
        from: document.getElementById('bus-from').value,
        to: document.getElementById('bus-to').value,
        time: document.getElementById('bus-time').value,
        seats: parseInt(document.getElementById('bus-seats').value),
        price: parseFloat(document.getElementById('bus-price').value),
        createdAt: new Date().toISOString()
      };

      try {
        await set(ref(busesDb, busId), busData);
        showSuccess(`Bus ${busId} added successfully`);
        busForm.reset();
      } catch (error) {
        showError('Bus add error: ' + error.message);
      }
    });
  }

  const passengerForm = document.getElementById('add-passenger-form');
  if (passengerForm) {
    passengerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const passengerId = getNextPassengerId();
      const passengerData = {
        name: document.getElementById('passenger-name').value,
        phone: document.getElementById('passenger-phone').value,
        email: document.getElementById('passenger-email').value,
        nationalId: document.getElementById('passenger-id').value,
        registrationDate: new Date().toISOString(),
        bookings: {} // Initialize empty bookings object
      };

      try {
        await set(ref(passengersDb, `passengers/${passengerId}`), passengerData);
        showSuccess(`Passenger ${passengerId} added successfully`);
        passengerForm.reset();
      } catch (error) {
        showError('Passenger add error: ' + error.message);
      }
    });
  }

  const bookingForm = document.getElementById('add-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const passengerId = document.getElementById('booking-passenger').value;
      const busId = document.getElementById('booking-bus').value;
      const seatNumber = parseInt(document.getElementById('booking-seat').value);
      const status = document.getElementById('booking-status').value;

      const bus = buses[busId];
      if (!bus) {
        showError('Selected bus not found');
        return;
      }

      if (seatNumber > bus.seats) {
        showError(`Seat number cannot exceed ${bus.seats}`);
        return;
      }

      // Check if seat is already booked
      const existingBooking = Object.values(bookings).find(booking => 
        booking.busId === busId && 
        booking.seatNumber === seatNumber && 
        booking.status === 'confirmed'
      );

      if (existingBooking) {
        showError('Seat already booked');
        return;
      }

      const bookingId = getNextBookingId();
      const bookingData = {
        passengerId,
        busId,
        seatNumber,
        status,
        price: bus.price,
        bookingDate: new Date().toISOString(),
        // Add bus and passenger details for easier access
        busFrom: bus.from,
        busTo: bus.to,
        busTime: bus.time,
        passengerName: passengers[passengerId]?.name || 'Unknown'
      };

      try {
        // Add booking to passenger's bookings
        await set(ref(passengersDb, `passengers/${passengerId}/bookings/${bookingId}`), bookingData);
        showSuccess(`Booking ${bookingId} created successfully`);
        bookingForm.reset();
      } catch (error) {
        showError('Booking creation error: ' + error.message);
      }
    });
  }
}

function initializeSearch() {
  const busSearch = document.getElementById('bus-search');
  const passengerSearch = document.getElementById('passenger-search');
  const bookingSearch = document.getElementById('booking-search');

  if (busSearch) busSearch.addEventListener('input', renderBuses);
  if (passengerSearch) passengerSearch.addEventListener('input', renderPassengers);
  if (bookingSearch) bookingSearch.addEventListener('input', renderBookings);
}

function loadData() {
  console.log('Loading data...');
  
  // Load buses data
  onValue(busesRef, (snapshot) => {
    console.log('Bus data:', snapshot.val());
    const data = snapshot.val() || {};
    
    buses = {};
    Object.keys(data).forEach(key => {
      if (key.startsWith('BUS') && typeof data[key] === 'object' && data[key] !== null) {
        buses[key] = data[key];
      }
    });
    
    console.log('Buses loaded:', Object.keys(buses).length);
    renderBuses();
    updateBookingSelects();
    updateAnalytics();
  }, (error) => {
    console.error('Bus data load error:', error);
    showError('Bus data load failed: ' + error.message);
  });

  // Load passengers data with their bookings
  onValue(passengersRef, (snapshot) => {
    console.log('Passenger data:', snapshot.val());
    const data = snapshot.val() || {};
    
    passengers = {};
    bookings = {}; // Reset bookings
    
    // Process each passenger
    Object.entries(data).forEach(([passengerId, passengerData]) => {
      if (passengerId.startsWith('PASS') && typeof passengerData === 'object' && passengerData !== null) {
        // Extract passenger info (excluding bookings)
        passengers[passengerId] = {
          name: passengerData.name,
          phone: passengerData.phone,
          email: passengerData.email,
          nationalId: passengerData.nationalId,
          registrationDate: passengerData.registrationDate
        };

        // Extract bookings and add to flattened bookings object
        if (passengerData.bookings && typeof passengerData.bookings === 'object') {
          Object.entries(passengerData.bookings).forEach(([bookingId, bookingData]) => {
            bookings[bookingId] = {
              ...bookingData,
              passengerId // Ensure passengerId is included
            };
          });
        }
      }
    });
    
    console.log('Passengers loaded:', Object.keys(passengers).length);
    console.log('Bookings loaded:', Object.keys(bookings).length);
    
    renderPassengers();
    renderBookings();
    updateBookingSelects();
    updateAnalytics();
  }, (error) => {
    console.error('Passenger data load error:', error);
    showError('Passenger data load failed: ' + error.message);
  });
}

function updateBookingSelects() {
  const passengerSelect = document.getElementById('booking-passenger');
  const busSelect = document.getElementById('booking-bus');

  if (passengerSelect) {
    passengerSelect.innerHTML = '<option value="">Select passenger</option>';
    Object.entries(passengers).forEach(([id, passenger]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${passenger.name} (${id})`;
      passengerSelect.appendChild(option);
    });
  }

  if (busSelect) {
    busSelect.innerHTML = '<option value="">Select bus</option>';
    Object.entries(buses).forEach(([id, bus]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${id}: ${bus.from} → ${bus.to} (${formatDateTime(bus.time)})`;
      busSelect.appendChild(option);
    });
  }
}

function renderBuses() {
  const tbody = document.getElementById('buses-table-body');
  if (!tbody) return;

  const searchTerm = document.getElementById('bus-search')?.value.toLowerCase() || '';
  
  if (Object.keys(buses).length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">No buses found</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  
  const sortedBuses = Object.entries(buses).sort(([a], [b]) => a.localeCompare(b));
  
  sortedBuses.forEach(([id, bus]) => {
    if (searchTerm && !Object.values(bus).some(val => 
      val.toString().toLowerCase().includes(searchTerm)) && 
      !id.toLowerCase().includes(searchTerm)) {
      return;
    }

    // FIX 1: Correct booked seats calculation
    const bookedSeats = Object.values(bookings).filter(booking => 
      booking.busId === id && booking.status === 'confirmed').length;
    const availableSeats = bus.seats - bookedSeats;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${id}</strong></td>
      <td>${bus.from}</td>
      <td>${bus.to}</td>
      <td>${formatDateTime(bus.time)}</td>
      <td>${bus.seats}</td>
      <td>${bookedSeats}</td>
      <td>${availableSeats}</td>
      <td>$${bus.price.toFixed(2)}</td>
      <td>
        <button class="btn btn-warning btn-small" onclick="editBus('${id}')">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteBus('${id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderPassengers() {
  const tbody = document.getElementById('passengers-table-body');
  if (!tbody) return;

  const searchTerm = document.getElementById('passenger-search')?.value.toLowerCase() || '';
  
  if (Object.keys(passengers).length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading">No passengers found</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  
  const sortedPassengers = Object.entries(passengers).sort(([a], [b]) => a.localeCompare(b));
  
  sortedPassengers.forEach(([id, passenger]) => {
    if (searchTerm && !Object.values(passenger).some(val => 
      val.toString().toLowerCase().includes(searchTerm)) &&
      !id.toLowerCase().includes(searchTerm)) {
      return;
    }

    const passengerBookings = Object.values(bookings).filter(booking => 
      booking.passengerId === id).length;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${id}</strong></td>
      <td>${passenger.name}</td>
      <td>${passenger.phone}</td>
      <td>${passenger.email || 'N/A'}</td>
      <td>${passenger.nationalId}</td>
      <td>${passengerBookings}</td>
      <td>${formatDate(passenger.registrationDate)}</td>
      <td>
        <button class="btn btn-warning btn-small" onclick="editPassenger('${id}')">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deletePassenger('${id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderBookings() {
  const tbody = document.getElementById('bookings-table-body');
  if (!tbody) return;

  const searchTerm = document.getElementById('booking-search')?.value.toLowerCase() || '';
  
  if (Object.keys(bookings).length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">No bookings found</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  
  const sortedBookings = Object.entries(bookings).sort(([a], [b]) => a.localeCompare(b));
  
  sortedBookings.forEach(([id, booking]) => {
    const passenger = passengers[booking.passengerId];
    const bus = buses[booking.busId];
    
    const passengerName = passenger?.name || booking.passengerName || 'Unknown';
    const busRoute = bus ? `${bus.from} → ${bus.to}` : `${booking.busFrom || 'Unknown'} → ${booking.busTo || 'Unknown'}`;
    
    const searchableText = `${id} ${passengerName} ${busRoute} ${booking.status}`.toLowerCase();
    if (searchTerm && !searchableText.includes(searchTerm)) {
      return;
    }

    // FIX 2: Handle undefined values for price and status
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${id}</strong></td>
      <td>${passengerName}</td>
      <td>${busRoute}</td>
      <td>${booking.seatNumber}</td>
      <td>${formatDateTime(booking.busTime || bus?.time)}</td>
      <td>$${booking.price?.toFixed(2) || '0.00'}</td>
      <td><span class="status-badge status-${booking.status}">${getStatusText(booking.status)}</span></td>
      <td>${formatDate(booking.bookingDate)}</td>
      <td>
        <button class="btn btn-warning btn-small" onclick="editBooking('${id}')">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteBooking('${id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

window.editBus = function(id) {
  const bus = buses[id];
  if (!bus) return;

  currentEditType = 'bus';
  currentEditId = id;

  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');
  const title = document.getElementById('modal-title');

  if (title) title.textContent = `Edit Bus ${id}`;
  
  if (form) {
    document.getElementById('modal-form-content').innerHTML = `
      <div class="form-group">
        <label>Bus ID:</label>
        <input type="text" value="${id}" disabled style="background-color: #f5f5f5;">
      </div>
      <div class="form-group">
        <label>From:</label>
        <input type="text" id="edit-from" value="${bus.from}" required>
      </div>
      <div class="form-group">
        <label>To:</label>
        <input type="text" id="edit-to" value="${bus.to}" required>
      </div>
      <div class="form-group">
        <label>Departure Time:</label>
        <input type="datetime-local" id="edit-time" value="${bus.time}" required>
      </div>
      <div class="form-group">
        <label>Total Seats:</label>
        <input type="number" id="edit-seats" value="${bus.seats}" min="1" required>
      </div>
      <div class="form-group">
        <label>Price:</label>
        <input type="number" id="edit-price" value="${bus.price}" step="0.01" min="0" required>
      </div>
    `;
  }

  if (modal) modal.classList.add('show');
};

window.editPassenger = function(id) {
  const passenger = passengers[id];
  if (!passenger) return;

  currentEditType = 'passenger';
  currentEditId = id;

  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');
  const title = document.getElementById('modal-title');

  if (title) title.textContent = `Edit Passenger ${id}`;
  
  if (form) {
    document.getElementById('modal-form-content').innerHTML = `
      <div class="form-group">
        <label>Passenger ID:</label>
        <input type="text" value="${id}" disabled style="background-color: #f5f5f5;">
      </div>
      <div class="form-group">
        <label>Full Name:</label>
        <input type="text" id="edit-name" value="${passenger.name}" required>
      </div>
      <div class="form-group">
        <label>Phone Number:</label>
        <input type="tel" id="edit-phone" value="${passenger.phone}" required>
      </div>
      <div class="form-group">
        <label>Email:</label>
        <input type="email" id="edit-email" value="${passenger.email || ''}">
      </div>
      <div class="form-group">
        <label>ID Number:</label>
        <input type="text" id="edit-national-id" value="${passenger.nationalId}" required>
      </div>
    `;
  }

  if (modal) modal.classList.add('show');
};

window.editBooking = function(id) {
  const booking = bookings[id];
  if (!booking) return;

  currentEditType = 'booking';
  currentEditId = id;

  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');
  const title = document.getElementById('modal-title');

  if (title) title.textContent = `Edit Booking ${id}`;
  
  if (form) {
    document.getElementById('modal-form-content').innerHTML = `
      <div class="form-group">
        <label>Booking ID:</label>
        <input type="text" value="${id}" disabled style="background-color: #f5f5f5;">
      </div>
      <div class="form-group">
        <label>Passenger:</label>
        <select id="edit-passenger" required>
          ${Object.entries(passengers).map(([pid, p]) => 
            `<option value="${pid}" ${pid === booking.passengerId ? 'selected' : ''}>${pid}: ${p.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Bus:</label>
        <select id="edit-bus" required>
          ${Object.entries(buses).map(([bid, b]) => 
            `<option value="${bid}" ${bid === booking.busId ? 'selected' : ''}>${bid}: ${b.from} → ${b.to}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Seat Number:</label>
        <input type="number" id="edit-seat-number" value="${booking.seatNumber}" min="1" required>
      </div>
      <div class="form-group">
        <label>Booking Status:</label>
        <select id="edit-status" required>
          <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
    `;
  }

  if (modal) modal.classList.add('show');
};

async function handleEditSubmit(e) {
  e.preventDefault();

  try {
    if (currentEditType === 'bus') {
      const updatedData = {
        from: document.getElementById('edit-from').value,
        to: document.getElementById('edit-to').value,
        time: document.getElementById('edit-time').value,
        seats: parseInt(document.getElementById('edit-seats').value),
        price: parseFloat(document.getElementById('edit-price').value)
      };

      if (buses[currentEditId].createdAt) {
        updatedData.createdAt = buses[currentEditId].createdAt;
      }

      await update(ref(busesDb, currentEditId), updatedData);
      showSuccess(`Bus ${currentEditId} updated`);
    } 
    else if (currentEditType === 'passenger') {
      const updatedData = {
        name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        email: document.getElementById('edit-email').value,
        nationalId: document.getElementById('edit-national-id').value
      };

      if (passengers[currentEditId].registrationDate) {
        updatedData.registrationDate = passengers[currentEditId].registrationDate;
      }

      await update(ref(passengersDb, `passengers/${currentEditId}`), updatedData);
      showSuccess(`Passenger ${currentEditId} updated`);
    }
    else if (currentEditType === 'booking') {
      const newBusId = document.getElementById('edit-bus').value;
      const newSeatNumber = parseInt(document.getElementById('edit-seat-number').value);
      
      const bus = buses[newBusId];
      if (newSeatNumber > bus.seats) {
        showError(`Seat number cannot exceed ${bus.seats}`);
        return;
      }

      const existingBooking = Object.entries(bookings).find(([bookingId, booking]) => 
        bookingId !== currentEditId &&
        booking.busId === newBusId && 
        booking.seatNumber === newSeatNumber && 
        booking.status === 'confirmed'
      );

      if (existingBooking) {
        showError('Seat already booked by another passenger');
        return;
      }

      const updatedData = {
        passengerId: document.getElementById('edit-passenger').value,
        busId: newBusId,
        seatNumber: newSeatNumber,
        status: document.getElementById('edit-status').value,
        price: bus.price
      };

      if (bookings[currentEditId].bookingDate) {
        updatedData.bookingDate = bookings[currentEditId].bookingDate;
      }

      // FIX 3: Correct booking update path
      const passengerId = document.getElementById('edit-passenger').value;
      await update(ref(passengersDb, `passengers/${passengerId}/bookings/${currentEditId}`), updatedData);
      showSuccess(`Booking ${currentEditId} updated`);
    }

    closeModal();
  } catch (error) {
    showError('Update error: ' + error.message);
  }
}

window.deleteBus = async function(id) {
  if (confirm(`Delete bus ${id}?`)) {
    try {
      await remove(ref(busesDb, id));
      const relatedBookings = Object.entries(bookings).filter(([_, booking]) => booking.busId === id);
      for (const [bookingId] of relatedBookings) {
        await remove(ref(passengersDb, `passengers/${booking.passengerId}/bookings/${bookingId}`));
      }
      showSuccess(`Bus ${id} deleted`);
    } catch (error) {
      showError('Delete error: ' + error.message);
    }
  }
};

window.deletePassenger = async function(id) {
  if (confirm(`Delete passenger ${id}?`)) {
    try {
      await remove(ref(passengersDb, `passengers/${id}`));
      showSuccess(`Passenger ${id} deleted`);
    } catch (error) {
      showError('Delete error: ' + error.message);
    }
  }
};

window.deleteBooking = async function(id) {
  if (confirm(`Delete booking ${id}?`)) {
    try {
      const passengerId = bookings[id]?.passengerId;
      if (!passengerId) {
        throw new Error('Passenger ID not found for booking');
      }
      await remove(ref(passengersDb, `passengers/${passengerId}/bookings/${id}`));
      showSuccess(`Booking ${id} deleted`);
    } catch (error) {
      showError('Delete error: ' + error.message);
    }
  }
};

function updateAnalytics() {
  const totalBuses = Object.keys(buses).length;
  const totalPassengers = Object.keys(passengers).length;
  const totalBookings = Object.keys(bookings).length;
  
  // FIX 4: Correct analytics calculations
  const bookedSeats = Object.values(bookings).filter(b => b.status === 'confirmed').length;
  const totalSeats = Object.values(buses).reduce((sum, bus) => sum + (bus.seats || 0), 0);
  const availableSeats = totalSeats - bookedSeats;
  
  const totalRevenue = Object.values(bookings)
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  document.getElementById('total-buses').textContent = totalBuses;
  document.getElementById('total-passengers').textContent = totalPassengers;
  document.getElementById('total-bookings').textContent = totalBookings;
  document.getElementById('booked-seats').textContent = bookedSeats;
  document.getElementById('available-seats').textContent = availableSeats;
  document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

  // FIX 5: Implement popular routes and frequent passengers
  updateAdvancedAnalytics();
}

function updateAdvancedAnalytics() {
  // Popular Routes
  const routeCounts = {};
  Object.values(bookings).forEach(booking => {
    if (booking.status === 'confirmed') {
      const routeKey = `${booking.busFrom}-${booking.busTo}`;
      routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
    }
  });

  const popularRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let routesHtml = '<ol>';
  popularRoutes.forEach(([route, count]) => {
    const [from, to] = route.split('-');
    routesHtml += `<li>${from} → ${to}: <strong>${count}</strong> bookings</li>`;
  });
  routesHtml += '</ol>';
  document.getElementById('popular-routes').innerHTML = routesHtml || '<div>No data available</div>';

  // Frequent Passengers
  const passengerCounts = {};
  Object.values(bookings).forEach(booking => {
    if (booking.status === 'confirmed') {
      passengerCounts[booking.passengerId] = (passengerCounts[booking.passengerId] || 0) + 1;
    }
  });

  const frequentPassengers = Object.entries(passengerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let passengersHtml = '<ol>';
  frequentPassengers.forEach(([passengerId, count]) => {
    const name = passengers[passengerId]?.name || 'Unknown Passenger';
    passengersHtml += `<li>${name}: <strong>${count}</strong> bookings</li>`;
  });
  passengersHtml += '</ol>';
  document.getElementById('frequent-passengers').innerHTML = passengersHtml || '<div>No data available</div>';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusText(status) {
  const statusMap = {
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showError(message) {
  alert('❌ ' + message);
}

document.addEventListener('DOMContentLoaded', init);

window.showTab = showTab;
window.closeModal = closeModal;