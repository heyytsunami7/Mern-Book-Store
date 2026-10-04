// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || "{}");

// Initialize Firebase
const app = initializeApp(firebaseConfig);

if (firebaseConfig.measurementId) {
  isSupported().then(yes => yes && getAnalytics(app)).catch(() => {});
}

export default app; 