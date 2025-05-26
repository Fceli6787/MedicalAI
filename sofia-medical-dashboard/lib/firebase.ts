import { initializeApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurar persistencia con manejo de cookies SOLO en el cliente
if (typeof window !== 'undefined') {
  (async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log("[Firebase Config] Persistencia configurada a LOCAL");
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          document.cookie = `firebaseAuthToken=${await user.getIdToken()}; path=/; secure; samesite=lax`;
        } else {
          document.cookie = 'firebaseAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      });
    } catch (error) {
      console.error("[Firebase Config] Error configurando persistencia local:", error);
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log("[Firebase Config] Persistencia configurada a SESSION");
      } catch (sessionError) {
        console.error("[Firebase Config] Error configurando persistencia de sesión:", sessionError);
        await setPersistence(auth, inMemoryPersistence);
      }
    }
  })();
}

export { app, auth };
