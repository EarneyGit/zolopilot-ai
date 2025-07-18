import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
// MongoDB integration removed - using Firebase only

// Firebase configuration - Connected to zolopilot-ai project
// SECURITY FIX: Using environment variables instead of hardcoded values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check your environment variables.');
} else {
  console.log('✅ Firebase configuration loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey
  });
}

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

export const signInWithGoogle = async (useRedirect = false) => {
  try {
    console.log('🔐 Starting Google sign-in process...', { useRedirect });
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Always use popup method for better compatibility across all environments
    // This avoids domain authorization issues with redirect method on Vercel
    console.log('🪟 Using popup method for Google sign-in (universal compatibility)');
    const userCredential = await signInWithPopup(auth, provider);
    console.log('✅ Google sign-in successful:', userCredential.user.email);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      customData: error.customData
    });
    
    // If popup is blocked, provide helpful error message
    if (error.code === 'auth/popup-blocked') {
      return { 
        success: false, 
        error: 'Popup was blocked by browser. Please allow popups for this site and try again.', 
        errorCode: error.code 
      };
    }
    
    return { success: false, error: error.message, errorCode: error.code };
  }
};

// Google redirect authentication removed - using popup method for universal compatibility

export const logOut = () => signOut(auth);

// Database functions (Firebase Firestore only)
// Legacy function - saves to single document (for backward compatibility)
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

// New function - saves mind map to user's collection
export const saveMindMapToGallery = async (userId, mindMapData, title, prompt) => {
  try {
    const mindMapsRef = collection(db, 'users', userId, 'mindmaps');
    const docRef = await addDoc(mindMapsRef, {
      title: title,
      prompt: prompt,
      mindMapData: mindMapData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving mind map to gallery:', error);
    return { success: false, error: error.message };
  }
};

// Load all mind maps for a user (up to 50, ordered by creation date)
export const loadUserMindMaps = async (userId) => {
  try {
    const mindMapsRef = collection(db, 'users', userId, 'mindmaps');
    const q = query(mindMapsRef, orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    const mindMaps = [];
    querySnapshot.forEach((doc) => {
      mindMaps.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return mindMaps;
  } catch (error) {
    console.error('Error loading user mind maps:', error);
    return [];
  }
};

// Delete a specific mind map
export const deleteMindMap = async (userId, mindMapId) => {
  try {
    const docRef = doc(db, 'users', userId, 'mindmaps', mindMapId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting mind map:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe to user's mind maps collection
export const subscribeToUserMindMaps = (userId, callback) => {
  const mindMapsRef = collection(db, 'users', userId, 'mindmaps');
  const q = query(mindMapsRef, orderBy('createdAt', 'desc'), limit(50));
  
  return onSnapshot(q, (querySnapshot) => {
    const mindMaps = [];
    querySnapshot.forEach((doc) => {
      mindMaps.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(mindMaps);
  });
};

// Legacy functions for backward compatibility
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