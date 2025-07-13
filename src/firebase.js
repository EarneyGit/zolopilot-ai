import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
// MongoDB integration removed - using Firebase only

// Firebase configuration - Connected to zolopilot-ai project
const firebaseConfig = {
  apiKey: "AIzaSyAHV-p-Lh_SFiEq-21wlYRpbX_IcT-n9l8",
  authDomain: "zolopilot-ai.firebaseapp.com",
  projectId: "zolopilot-ai",
  storageBucket: "zolopilot-ai.firebasestorage.app",
  messagingSenderId: "969187944606",
  appId: "1:969187944606:web:31a99228b53ce44773738f",
  measurementId: "G-KXQ777ZL66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const signInAnonymous = () => signInAnonymously(auth);

export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logOut = () => signOut(auth);

// Database functions (Firebase Firestore only)
export const saveMindMap = async (userId, mindMapData) => {
  try {
    const docRef = doc(db, 'mindmaps', userId);
    await setDoc(docRef, {
      mindMap: mindMapData,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error saving mind map:', error);
    return false;
  }
};

export const loadMindMap = async (userId) => {
  try {
    const docRef = doc(db, 'mindmaps', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().mindMap;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error loading mind map:', error);
    return null;
  }
};

export const subscribeToMindMap = (userId, callback) => {
  const docRef = doc(db, 'mindmaps', userId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().mindMap);
    }
  });
};

export { onAuthStateChanged };