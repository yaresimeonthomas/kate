import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSDKoQS8admwPicpANR-4_0y4Lf7phDbs",
  authDomain: "kate-aos-pwa.firebaseapp.com",
  projectId: "kate-aos-pwa",
  storageBucket: "kate-aos-pwa.firebasestorage.app",
  messagingSenderId: "689735221755",
  appId: "1:689735221755:web:c6c692956334b6c64d0b5e"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
