// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3Z4smm1Mfl0X9xehIn0K1_hfuezB3mBw",
  authDomain: "busticketsystem-c4115.firebaseapp.com",
  databaseURL: "https://busticketsystem-c4115-default-rtdb.firebaseio.com",
  projectId: "busticketsystem-c4115",
  storageBucket: "busticketsystem-c4115.appspot.com",
  messagingSenderId: "780835175059",
  appId: "1:780835175059:web:f78299bdd6e73213906b66"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
