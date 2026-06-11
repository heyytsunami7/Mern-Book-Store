// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjnr920XluvzWkElNB93bLswm0DTe68EA",
  authDomain: "mern-book-store-cc6d3.firebaseapp.com",
  projectId: "mern-book-store-cc6d3",
  storageBucket: "mern-book-store-cc6d3.appspot.com",
  messagingSenderId: "1055309577547",
  appId: "1:1055309577547:web:26b2e7565ee951ef17bcce",
  measurementId: "G-3EG6DL9F37"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app; 