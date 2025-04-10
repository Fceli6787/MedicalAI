import { auth } from '../src/config/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const provider = new GoogleAuthProvider();

export async function handleGoogleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In error:", error);
    throw error;
  }
}

// Export both auth and signOut
export { auth, signOut };
