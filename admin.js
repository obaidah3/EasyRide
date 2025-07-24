import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Firebase configurations
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

// Initialize Firebase apps with error handling
let busesApp, passengersApp, busesDb, passengersDb;

try {
  busesApp = initializeApp(busesFirebaseConfig, 'buses');
  console.log('✅ تم تهيئة تطبيق قاعدة بيانات الحافلات');
} catch (error) {
  console.error('❌ خطأ في تهيئة تطبيق قاعدة بيانات الحافلات:', error);
}

try {
  passengersApp = initializeApp(passengersFirebaseConfig, 'passengers');
  console.log('✅ تم تهيئة تطبيق قاعدة بيانات الركاب');
} catch (error) {
  console.error('❌ خطأ في تهيئة تطبيق قاعدة بيانات الركاب:', error);
}

// Get database instances with error handling
try {
  busesDb = getDatabase(busesApp);
  console.log('✅ تم الحصول على مثيل قاعدة بيانات الحافلات');
} catch (error) {
  console.error('❌ خطأ في الحصول على مثيل قاعدة بيانات الحافلات:', error);
}

try {
  passengersDb = getDatabase(passengersApp);
  console.log('✅ تم الحصول على مثيل قاعدة بيانات الركاب');
} catch (error) {
  console.error('❌ خطأ في الحصول على مثيل قاعدة بيانات الركاب:', error);
}

// Database references - تم تغيير المسار للوصول للبيانات الموجودة
const busesRef = ref(busesDb); // الوصول للروت الرئيسي مباشرة
const passengersRef = ref(passengersDb);
const bookingsRef = ref(passengersDb, "bookings");

// Global variables
let buses = {};
let passengers = {};
let bookings = {};
let currentEditType = '';
let currentEditId = '';

// Function to generate next bus ID
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

// Function to generate next passenger ID
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

// Function to generate next booking ID
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

// Initialize the application
function init() {
  console.log('تهيئة التطبيق...');
  
  // Test Firebase connection
  testFirebaseConnection();
  
  initializeTabs();
  initializeModal();
  initializeForms();
  initializeSearch();
  loadData();
  
  // Update connection status for buses database
  const busesConnectedRef = ref(busesDb, ".info/connected");
  onValue(busesConnectedRef, (snap) => {
    console.log('حالة اتصال قاعدة بيانات الحافلات:', snap.val());
    const status = document.getElementById('buses-connection-status') || document.getElementById('connection-status');
    if (status) {
      if (snap.val() === true) {
        status.textContent = 'متصل - قاعدة بيانات الحافلات';
        status.className = 'connection-status connected';
      } else {
        status.textContent = 'منقطع - قاعدة بيانات الحافلات';
        status.className = 'connection-status disconnected';
      }
    }
  });

  // Update connection status for passengers database
  const passengersConnectedRef = ref(passengersDb, ".info/connected");
  onValue(passengersConnectedRef, (snap) => {
    console.log('حالة اتصال قاعدة بيانات الركاب:', snap.val());
    const status = document.getElementById('passengers-connection-status');
    if (status) {
      if (snap.val() === true) {
        status.textContent = 'متصل - قاعدة بيانات الركاب';
        status.className = 'connection-status connected';
      } else {
        status.textContent = 'منقطع - قاعدة بيانات الركاب';
        status.className = 'connection-status disconnected';
      }
    }
  });
}

// Test Firebase connection
async function testFirebaseConnection() {
  console.log('اختبار الاتصال...');
  
  try {
    // Test buses database
    const busesTestRef = ref(busesDb, 'test');
    await set(busesTestRef, { timestamp: Date.now() });
    await remove(busesTestRef);
    console.log('✅ نجح الاتصال بقاعدة بيانات الحافلات');
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة بيانات الحافلات:', error);
  }

  try {
    // Test passengers database
    const passengersTestRef = ref(passengersDb, 'test');
    await set(passengersTestRef, { timestamp: Date.now() });
    await remove(passengersTestRef);
    console.log('✅ نجح الاتصال بقاعدة بيانات الركاب');
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة بيانات الركاب:', error);
  }
}

// Tab management
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

// Modal management
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

// Form initialization
function initializeForms() {
  // Bus form
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
        // إضافة الحافلة مع ID ثابت
        await set(ref(busesDb, busId), busData);
        showSuccess(`تم إضافة الحافلة ${busId} بنجاح`);
        busForm.reset();
      } catch (error) {
        showError('خطأ في إضافة الحافلة: ' + error.message);
      }
    });
  }

  // Passenger form
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
        registrationDate: new Date().toISOString()
      };

      try {
        await set(ref(passengersDb, `passengers/${passengerId}`), passengerData);
        showSuccess(`تم إضافة الراكب ${passengerId} بنجاح`);
        passengerForm.reset();
      } catch (error) {
        showError('خطأ في إضافة الراكب: ' + error.message);
      }
    });
  }

  // Booking form
  const bookingForm = document.getElementById('add-booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const passengerId = document.getElementById('booking-passenger').value;
      const busId = document.getElementById('booking-bus').value;
      const seatNumber = parseInt(document.getElementById('booking-seat').value);
      const status = document.getElementById('booking-status').value;

      // Validate seat availability
      const bus = buses[busId];
      if (!bus) {
        showError('الحافلة المحددة غير موجودة');
        return;
      }

      if (seatNumber > bus.seats) {
        showError(`رقم المقعد لا يمكن أن يتجاوز ${bus.seats}`);
        return;
      }

      // Check if seat is already booked
      const existingBooking = Object.values(bookings).find(booking => 
        booking.busId === busId && 
        booking.seatNumber === seatNumber && 
        booking.status === 'confirmed'
      );

      if (existingBooking) {
        showError('هذا المقعد محجوز مسبقاً');
        return;
      }

      const bookingId = getNextBookingId();
      const bookingData = {
        passengerId,
        busId,
        seatNumber,
        status,
        price: bus.price,
        bookingDate: new Date().toISOString()
      };

      try {
        await set(ref(busesDb, `bookings/${bookingId}`), bookingData);
        showSuccess(`تم إنشاء الحجز ${bookingId} بنجاح`);
        bookingForm.reset();
      } catch (error) {
        showError('خطأ في إنشاء الحجز: ' + error.message);
      }
    });
  }
}

// Search functionality
function initializeSearch() {
  const busSearch = document.getElementById('bus-search');
  const passengerSearch = document.getElementById('passenger-search');
  const bookingSearch = document.getElementById('booking-search');

  if (busSearch) busSearch.addEventListener('input', renderBuses);
  if (passengerSearch) passengerSearch.addEventListener('input', renderPassengers);
  if (bookingSearch) bookingSearch.addEventListener('input', renderBookings);
}

// Load data from Firebase

function loadData() {
  console.log('تحميل البيانات من Firebase...');
  
  // Load buses with error handling
  onValue(busesRef, (snapshot) => {
    console.log('بيانات الحافلات:', snapshot.val());
    const data = snapshot.val() || {};
    
    // فلترة البيانات للحصول على الحافلات فقط (التي تبدأ بـ BUS)
    buses = {};
    Object.keys(data).forEach(key => {
      if (key.startsWith('BUS') && typeof data[key] === 'object' && data[key] !== null) {
        buses[key] = data[key];
      }
    });
    
    // تحميل الحجوزات إذا كانت موجودة
    if (data.bookings) {
      bookings = data.bookings;
    }
    
    console.log('عدد الحافلات المحملة:', Object.keys(buses).length);
    console.log('عدد الحجوزات المحملة:', Object.keys(bookings).length);
    renderBuses();
    renderBookings();
    updateBookingSelects();
    updateAnalytics();
  }, (error) => {
    console.error('خطأ في تحميل بيانات الحافلات:', error);
    showError('فشل في تحميل بيانات الحافلات: ' + error.message);
  });

  // Load passengers with error handling - الإصلاح هنا
  onValue(passengersRef, (snapshot) => {
    console.log('بيانات الركاب:', snapshot.val());
    const data = snapshot.val() || {};
    
    // إعادة تعيين بيانات الركاب
    passengers = {};
    
    // تحميل الركاب من مجلد passengers
    if (data.passengers && typeof data.passengers === 'object') {
      passengers = data.passengers;
    }
    
    // تحميل الحجوزات من قاعدة بيانات الركاب أيضاً
    if (data.bookings && typeof data.bookings === 'object') {
      // دمج الحجوزات من قاعدة بيانات الركاب مع الحجوزات الموجودة
      Object.keys(data.bookings).forEach(key => {
        bookings[key] = data.bookings[key];
      });
    }
    
    // التحقق من البيانات الأخرى التي قد تكون حجوزات (تبدأ بـ -)
    Object.keys(data).forEach(key => {
      if (key.startsWith('-') && typeof data[key] === 'object' && data[key] !== null) {
        bookings[key] = data[key];
      }
    });
    
    console.log('عدد الركاب المحملة:', Object.keys(passengers).length);
    console.log('عدد الحجوزات المحملة من قاعدة بيانات الركاب:', Object.keys(bookings).length);
    
    renderPassengers();
    renderBookings();
    updateBookingSelects();
    updateAnalytics();
  }, (error) => {
    console.error('خطأ في تحميل بيانات الركاب:', error);
    showError('فشل في تحميل بيانات الركاب: ' + error.message);
  });
}
// Update booking form selects
function updateBookingSelects() {
  const passengerSelect = document.getElementById('booking-passenger');
  const busSelect = document.getElementById('booking-bus');

  if (passengerSelect) {
    passengerSelect.innerHTML = '<option value="">اختر راكب</option>';
    Object.entries(passengers).forEach(([id, passenger]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${passenger.name} (${id})`;
      passengerSelect.appendChild(option);
    });
  }

  if (busSelect) {
    busSelect.innerHTML = '<option value="">اختر حافلة</option>';
    Object.entries(buses).forEach(([id, bus]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${id}: ${bus.from} → ${bus.to} (${formatDateTime(bus.time)})`;
      busSelect.appendChild(option);
    });
  }
}

// Render functions
function renderBuses() {
  const tbody = document.getElementById('buses-table-body');
  if (!tbody) return;

  const searchTerm = document.getElementById('bus-search')?.value.toLowerCase() || '';
  
  if (Object.keys(buses).length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">لا توجد حافلات</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  
  // ترتيب الحافلات حسب الـ ID
  const sortedBuses = Object.entries(buses).sort(([a], [b]) => a.localeCompare(b));
  
  sortedBuses.forEach(([id, bus]) => {
    if (searchTerm && !Object.values(bus).some(val => 
      val.toString().toLowerCase().includes(searchTerm)) && 
      !id.toLowerCase().includes(searchTerm)) {
      return;
    }

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
      <td>$${bus.price}</td>
      <td>
        <button class="btn btn-warning btn-small" onclick="editBus('${id}')">تعديل</button>
        <button class="btn btn-danger btn-small" onclick="deleteBus('${id}')">حذف</button>
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
    tbody.innerHTML = '<tr><td colspan="8" class="loading">لا يوجد ركاب</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  
  // ترتيب الركاب حسب الـ ID
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
      <td>${passenger.email || 'غير محدد'}</td>
      <td>${passenger.nationalId}</td>
      <td>${passengerBookings}</td>
      <td>${formatDate(passenger.registrationDate)}</td>
      <td>
        <button class="btn btn-warning btn-small" onclick="editPassenger('${id}')">تعديل</button>
        <button class="btn btn-danger btn-small" onclick="deletePassenger('${id}')">حذف</button>
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
    tbody.innerHTML = '<tr><td colspan="9" class="loading">لا توجد حجوزات</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  
  // ترتيب الحجوزات حسب الـ ID
  const sortedBookings = Object.entries(bookings).sort(([a], [b]) => a.localeCompare(b));
  
  sortedBookings.forEach(([id, booking]) => {
  const searchableText = `${id} ${booking.passengerName} ${booking.busRoute} ${booking.status}`.toLowerCase();
  if (searchTerm && !searchableText.includes(searchTerm)) {
    return;
  }

  const row = document.createElement('tr');
  row.innerHTML = `
    <td><strong>${id}</strong></td>
    <td>${booking.passengerName}</td>
    <td>${booking.busRoute}</td>
    <td>-</td>
    <td>${formatDateTime(booking.busTime)}</td>
    <td>-</td>
    <td><span class="status-badge status-${booking.status}">${getStatusText(booking.status)}</span></td>
    <td>${formatDate(booking.bookingDate)}</td>
    <td>
      <button class="btn btn-warning btn-small" onclick="editBooking('${id}')">تعديل</button>
      <button class="btn btn-danger btn-small" onclick="deleteBooking('${id}')">حذف</button>
    </td>
  `;
  tbody.appendChild(row);
});
}

// Edit functions
window.editBus = function(id) {
  const bus = buses[id];
  if (!bus) return;

  currentEditType = 'bus';
  currentEditId = id;

  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');
  const title = document.getElementById('edit-modal-title');

  if (title) title.textContent = `تعديل الحافلة ${id}`;
  
  if (form) {
    form.innerHTML = `
      <div class="form-group">
        <label>رقم الحافلة:</label>
        <input type="text" value="${id}" disabled style="background-color: #f5f5f5;">
      </div>
      <div class="form-group">
        <label>من:</label>
        <input type="text" id="edit-from" value="${bus.from}" required>
      </div>
      <div class="form-group">
        <label>إلى:</label>
        <input type="text" id="edit-to" value="${bus.to}" required>
      </div>
      <div class="form-group">
        <label>الوقت:</label>
        <input type="datetime-local" id="edit-time" value="${bus.time}" required>
      </div>
      <div class="form-group">
        <label>عدد المقاعد:</label>
        <input type="number" id="edit-seats" value="${bus.seats}" min="1" required>
      </div>
      <div class="form-group">
        <label>السعر:</label>
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
  const title = document.getElementById('edit-modal-title');

  if (title) title.textContent = `تعديل الراكب ${id}`;
  
  if (form) {
    form.innerHTML = `
      <div class="form-group">
        <label>رقم الراكب:</label>
        <input type="text" value="${id}" disabled style="background-color: #f5f5f5;">
      </div>
      <div class="form-group">
        <label>الاسم:</label>
        <input type="text" id="edit-name" value="${passenger.name}" required>
      </div>
      <div class="form-group">
        <label>الهاتف:</label>
        <input type="tel" id="edit-phone" value="${passenger.phone}" required>
      </div>
      <div class="form-group">
        <label>البريد الإلكتروني:</label>
        <input type="email" id="edit-email" value="${passenger.email || ''}">
      </div>
      <div class="form-group">
        <label>الرقم القومي:</label>
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
  const title = document.getElementById('edit-modal-title');

  if (title) title.textContent = `تعديل الحجز ${id}`;
  
  if (form) {
    form.innerHTML = `
      <div class="form-group">
        <label>رقم الحجز:</label>
        <input type="text" value="${id}" disabled style="background-color: #f5f5f5;">
      </div>
      <div class="form-group">
        <label>الراكب:</label>
        <select id="edit-passenger" required>
          ${Object.entries(passengers).map(([pid, p]) => 
            `<option value="${pid}" ${pid === booking.passengerId ? 'selected' : ''}>${pid}: ${p.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>الحافلة:</label>
        <select id="edit-bus" required>
          ${Object.entries(buses).map(([bid, b]) => 
            `<option value="${bid}" ${bid === booking.busId ? 'selected' : ''}>${bid}: ${b.from} → ${b.to}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>رقم المقعد:</label>
        <input type="number" id="edit-seat-number" value="${booking.seatNumber}" min="1" required>
      </div>
      <div class="form-group">
        <label>الحالة:</label>
        <select id="edit-status" required>
          <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
          <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>في الانتظار</option>
          <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
        </select>
      </div>
    `;
  }

  if (modal) modal.classList.add('show');
};

// Handle edit form submission
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

      // الاحتفاظ ببعض البيانات الأصلية
      if (buses[currentEditId].createdAt) {
        updatedData.createdAt = buses[currentEditId].createdAt;
      }

      await update(ref(busesDb, currentEditId), updatedData);
      showSuccess(`تم تحديث الحافلة ${currentEditId} بنجاح`);
    } 
    else if (currentEditType === 'passenger') {
      const updatedData = {
        name: document.getElementById('edit-name').value,
        phone: document.getElementById('edit-phone').value,
        email: document.getElementById('edit-email').value,
        nationalId: document.getElementById('edit-national-id').value
      };

      // الاحتفاظ ببعض البيانات الأصلية
      if (passengers[currentEditId].registrationDate) {
        updatedData.registrationDate = passengers[currentEditId].registrationDate;
      }

      await update(ref(passengersDb, `passengers/${currentEditId}`), updatedData);
      showSuccess(`تم تحديث الراكب ${currentEditId} بنجاح`);
    }
    else if (currentEditType === 'booking') {
      const newBusId = document.getElementById('edit-bus').value;
      const newSeatNumber = parseInt(document.getElementById('edit-seat-number').value);
      
      // التحقق من توفر المقعد
      const bus = buses[newBusId];
      if (newSeatNumber > bus.seats) {
        showError(`رقم المقعد لا يمكن أن يتجاوز ${bus.seats}`);
        return;
      }

      // التحقق من عدم حجز المقعد من قبل شخص آخر
      const existingBooking = Object.entries(bookings).find(([bookingId, booking]) => 
        bookingId !== currentEditId &&
        booking.busId === newBusId && 
        booking.seatNumber === newSeatNumber && 
        booking.status === 'confirmed'
      );

      if (existingBooking) {
        showError('هذا المقعد محجوز مسبقاً من راكب آخر');
        return;
      }

      const updatedData = {
        passengerId: document.getElementById('edit-passenger').value,
        busId: newBusId,
        seatNumber: newSeatNumber,
        status: document.getElementById('edit-status').value,
        price: bus.price
      };

      // الاحتفاظ ببعض البيانات الأصلية
      if (bookings[currentEditId].bookingDate) {
        updatedData.bookingDate = bookings[currentEditId].bookingDate;
      }

      await update(ref(passengersDb, currentEditId), updatedData);
      showSuccess(`تم تحديث الحجز ${currentEditId} بنجاح`);
    }

    closeModal();
  } catch (error) {
    showError('خطأ في التحديث: ' + error.message);
  }
}

// Delete functions
window.deleteBus = async function(id) {
  if (confirm(`هل أنت متأكد من حذف الحافلة ${id}؟`)) {
    try {
      await remove(ref(busesDb, id));
      // Also delete related bookings
      const relatedBookings = Object.entries(bookings).filter(([_, booking]) => booking.busId === id);
      for (const [bookingId] of relatedBookings) {
        await remove(ref(busesDb, `bookings/${bookingId}`));
      }
      showSuccess(`تم حذف الحافلة ${id} بنجاح`);
    } catch (error) {
      showError('خطأ في الحذف: ' + error.message);
    }
  }
};

window.deletePassenger = async function(id) {
  if (confirm(`هل أنت متأكد من حذف الراكب ${id}؟`)) {
    try {
      await remove(ref(passengersDb, `passengers/${id}`));
      // Also delete related bookings
      const relatedBookings = Object.entries(bookings).filter(([_, booking]) => booking.passengerId === id);
      for (const [bookingId] of relatedBookings) {
        await remove(ref(busesDb, `bookings/${bookingId}`));
      }
      showSuccess(`تم حذف الراكب ${id} بنجاح`);
    } catch (error) {
      showError('خطأ في الحذف: ' + error.message);
    }
  }
};

window.deleteBooking = async function(id) {
  if (confirm(`هل أنت متأكد من حذف الحجز ${id}؟`)) {
    try {
     await remove(ref(passengersDb, id));
      showSuccess(`تم حذف الحجز ${id} بنجاح`);
    } catch (error) {
      showError('خطأ في الحذف: ' + error.message);
    }
  }
};

// Analytics
function updateAnalytics() {
  const totalBuses = Object.keys(buses).length;
  const totalPassengers = Object.keys(passengers).length;
  const totalBookings = Object.keys(bookings).length;
  const confirmedBookings = Object.values(bookings).filter(b => b.status === 'confirmed').length;
  const totalRevenue = Object.values(bookings)
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const elements = {
    'total-buses': totalBuses,
    'total-passengers': totalPassengers,
    'total-bookings': totalBookings,
    'confirmed-bookings': confirmedBookings,
    'total-revenue': `${totalRevenue.toFixed(2)}`
  };

  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'NA';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG');
}
ref(passengersDb, "passengers")
function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  return date.toLocaleString('ar-EG');
}

function getStatusText(status) {
  const statusMap = {
    'confirmed': 'confirmed',
    'pending': 'pending',
    'cancelled': 'canceled'
  };
  return statusMap[status] || status;
}

function showSuccess(message) {
  alert('✅ ' + message);
}

function showError(message) {
  alert('❌ ' + message);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions globally available
window.showTab = showTab;
window.closeModal = closeModal;