// Enhanced passenger.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getDatabase,
  ref,
  update,
  push,
  set,
  child,
  onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Firebase Config  (الداتابيز الأصلية)
const readFirebaseConfig = {
  apiKey: "AIzaSyB3Z4smm1Mfl0X9xehIn0K1_hfuezB3mBw",
  authDomain: "busticketsystem-c4115.firebaseapp.com",
  databaseURL: "https://busticketsystem-c4115-default-rtdb.firebaseio.com",
  projectId: "busticketsystem-c4115",
  storageBucket: "busticketsystem-c4115.appspot.com",
  messagingSenderId: "780835175059",
  appId: "1:780835175059:web:f78299bdd6e73213906b66"
};

// Firebase Config (الداتابيز الجديدة للحجوزات)
const writeFirebaseConfig = {
  apiKey: "AIzaSyCu5xVwvfFBKhar_ASjj9XDFiyg5voVt0U",
  authDomain: "passengersbussystem.firebaseapp.com",
  databaseURL: "https://passengersbussystem-default-rtdb.firebaseio.com",
  projectId: "passengersbussystem",
  storageBucket: "passengersbussystem.firebasestorage.app",
  messagingSenderId: "989554274702",
  appId: "1:989554274702:web:59e73c5435bc6d341574df"
};

// Initialize Firebase 
const readApp = initializeApp(readFirebaseConfig, "readApp");
const writeApp = initializeApp(writeFirebaseConfig, "writeApp");

const readDb = getDatabase(readApp);
const writeDb = getDatabase(writeApp);


let allBuses = {};
let currentFrom = "";
let currentTo = "";

// عرض كل العربيات عند تحميل الصفحة
function displayAllBuses() {
  console.log("🚌 Loading all buses...");
  
  const busesRef = ref(readDb, "/");
  
  onValue(busesRef, (snapshot) => {
    console.log("📡 Firebase data received");
    
    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) {
      console.error("❌ Results container not found!");
      return;
    }

    if (!snapshot.exists()) {
      console.log("⚠️ No data in Firebase");
      resultsContainer.innerHTML = "<p>No buses available in database.</p>";
      return;
    }

    allBuses = snapshot.val();
    console.log("📊 All buses loaded:", Object.keys(allBuses).length);
    
    renderBuses(allBuses);
  }, (error) => {
    console.error("🔥 Firebase error:", error);
    const resultsContainer = document.getElementById("results");
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p>Error connecting to database: ${error.message}</p>`;
    }
  });
}

// عرض العربيات في الصفحة
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
    
    const busCard = document.createElement("div");
    busCard.className = "bus-card";
    busCard.setAttribute("data-bus-id", id);
    busCard.innerHTML = `
      <div class="bus-info">
        <h3>${bus.from} ➝ ${bus.to}</h3>
        <p><strong>Time:</strong> ${formatTime(bus.time)}</p>
        <p><strong>Available Seats:</strong> <span class="seats-count">${bus.seats}</span></p>
        <button class="book-btn" id="book-${id}">Book Now 🎫</button>
      </div>
      <div id="form-${id}" class="booking-form hidden-form">
        <h4>📝 Booking Details</h4>
        <input type="text" id="name-${id}" placeholder="Your Full Name" required>
        <input type="tel" id="phone-${id}" placeholder="Phone Number" required>
        <div class="form-buttons">
          <button class="confirm-btn" id="confirm-${id}">Confirm Booking ✅</button>
          <button class="cancel-btn" id="cancel-${id}">Cancel ❌</button>
        </div>
      </div>
    `;
    
    resultsContainer.appendChild(busCard);

    // إضافة event listeners
    setupBusEventListeners(id, bus.seats);
  }
  
  if (busCount === 0) {
    resultsContainer.innerHTML = "<p>No buses available with seats.</p>";
  } else {
    console.log(`✅ Displayed ${busCount} buses`);
  }
}

// إعداد event listeners لكل عربية
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

// البحث والفلترة
window.searchBuses = function () {
  console.log("🔍 Search function started");
  
  const fromInput = document.getElementById("fromInput");
  const toInput = document.getElementById("toInput");
  
  if (!fromInput || !toInput) {
    console.error("❌ Search inputs not found!");
    return;
  }
  
  currentFrom = fromInput.value.trim().toLowerCase();
  currentTo = toInput.value.trim().toLowerCase();
  
  console.log("📍 Search params:", { from: currentFrom, to: currentTo });

  // إذا كانت الحقول فارغة، اعرض كل العربيات
  if (!currentFrom && !currentTo) {
    renderBuses(allBuses);
    return;
  }

  // فلترة العربيات
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
  
  console.log(`🎯 Found ${matchCount} matching buses`);
  renderBuses(filteredBuses);
  
  // إضافة رسالة البحث
  const resultsContainer = document.getElementById("results");
  if (matchCount > 0) {
    const searchInfo = document.createElement("div");
    searchInfo.className = "search-info";
    searchInfo.innerHTML = `<p>🔍 Found ${matchCount} buses matching your search</p>`;
    resultsContainer.insertBefore(searchInfo, resultsContainer.firstChild);
  }
};

// مسح البحث وعرض كل العربيات
window.clearSearch = function () {
  document.getElementById("fromInput").value = "";
  document.getElementById("toInput").value = "";
  currentFrom = "";
  currentTo = "";
  renderBuses(allBuses);
  console.log("🔄 Search cleared, showing all buses");
};

// إظهار نموذج الحجز
function showBookingForm(busId) {
  console.log(`📝 Showing booking form for bus ${busId}`);
  const formEl = document.getElementById(`form-${busId}`);
  const bookBtn = document.getElementById(`book-${busId}`);
  
  if (formEl && bookBtn) {
    formEl.classList.remove("hidden-form");
    bookBtn.style.display = "none";
  }
}

// إخفاء نموذج الحجز
function hideBookingForm(busId) {
  console.log(`❌ Hiding booking form for bus ${busId}`);
  const formEl = document.getElementById(`form-${busId}`);
  const bookBtn = document.getElementById(`book-${busId}`);
  const nameInput = document.getElementById(`name-${busId}`);
  const phoneInput = document.getElementById(`phone-${busId}`);
  
  if (formEl && bookBtn) {
    formEl.classList.add("hidden-form");
    bookBtn.style.display = "block";
    
    // مسح البيانات
    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
  }
}

// تأكيد الحجز
async function confirmBooking(busId, seatsAvailable) {
  console.log(`🎫 Confirming booking for bus ${busId}`);
  
  const nameInput = document.getElementById(`name-${busId}`);
  const phoneInput = document.getElementById(`phone-${busId}`);
  const confirmBtn = document.getElementById(`confirm-${busId}`);

  if (!nameInput || !phoneInput || !confirmBtn) {
    console.error("❌ Booking form elements not found");
    return;
  }

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name || !phone) {
    alert("⚠️ Please enter both name and phone number.");
    return;
  }

  if (phone.length < 10) {
    alert("⚠️ Please enter a valid phone number.");
    return;
  }

  // التحقق من المقاعد المتاحة الحالية
  const currentSeats = parseInt(document.querySelector(`[data-bus-id="${busId}"] .seats-count`).textContent);
  
  if (currentSeats <= 0) {
    alert("❌ This bus is already full.");
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Booking... ⏳";

  try {
    const newCount = currentSeats - 1;
    console.log(`🔄 Updating seats from ${currentSeats} to ${newCount}`);

    // تحديث المقاعد في الداتابيز الأصلية
    await update(ref(readDb, `${busId}`), {
      seats: newCount
    });

    // إضافة الحجز في الداتابيز الجديدة
    const bookingRef = push(child(ref(writeDb), "bookings"));
    const bookingData = {
      busId,
      busRoute: `${allBuses[busId].from} → ${allBuses[busId].to}`,
      busTime: allBuses[busId].time,
      passengerName: name,
      phone,
      bookingDate: new Date().toISOString(),
      status: "confirmed"
    };
    
    await set(bookingRef, bookingData);

    console.log("✅ Booking successful");
    alert(`✅ Booking confirmed!\n\n🎫 Booking ID: ${bookingRef.key}\n👤 Name: ${name}\n🚌 Route: ${bookingData.busRoute}\n📱 Phone: ${phone}`);
    
    // تحديث العرض
    document.querySelector(`[data-bus-id="${busId}"] .seats-count`).textContent = newCount;
    allBuses[busId].seats = newCount;
    
    // إخفاء النموذج
    hideBookingForm(busId);
    
    // إخفاء العربية إذا لم تعد متاحة
    if (newCount <= 0) {
      document.querySelector(`[data-bus-id="${busId}"]`).style.opacity = "0.5";
      document.getElementById(`book-${busId}`).disabled = true;
      document.getElementById(`book-${busId}`).textContent = "Sold Out 🚫";
    }
    
  } catch (error) {
    console.error("❌ Booking error:", error);
    alert("❌ Booking failed. Please try again.");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm Booking ✅";
  }
}

// تنسيق الوقت
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

// بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 App starting...");
  displayAllBuses();
});

// للاختبار - إضافة البيانات (مؤقت)
async function addSampleData() {
  const sampleBuses = {
    "BUS001": { "from": "Alexandria", "to": "Cairo", "time": "2025-07-25T08:00", "seats": 40 },
    "BUS002": { "from": "Cairo", "to": "Hurghada", "time": "2025-07-25T10:30", "seats": 45 },
    "BUS003": { "from": "Tanta", "to": "Alexandria", "time": "2025-07-25T12:15", "seats": 35 },
    "BUS004": { "from": "Mansoura", "to": "Cairo", "time": "2025-07-25T14:00", "seats": 50 },
    "BUS005": { "from": "Cairo", "to": "Ismailia", "time": "2025-07-25T16:45", "seats": 42 }
  };

  try {
    await set(ref(readDb), sampleBuses);
    console.log("✅ Sample data added!");
    displayAllBuses();
  } catch (error) {
    console.error("❌ Error adding sample data:", error);
  }
}

window.addSampleData = addSampleData;
window.clearSearch = clearSearch;