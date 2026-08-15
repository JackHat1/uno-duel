import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyAj6-bnXTVi0TX9TEMx47AEalwmppye7pQ',
  authDomain: 'uno-online-f467f.firebaseapp.com',
  databaseURL: 'https://uno-online-f467f-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'uno-online-f467f',
  storageBucket: 'uno-online-f467f.firebasestorage.app',
  messagingSenderId: '787895610707',
  appId: '1:787895610707:web:b3888fac7a77e151b585a6',
  measurementId: 'G-M1327WMHE3',
}

export const firebaseConfigured = true

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app, firebaseConfig.databaseURL)

const AUTH_READY_TIMEOUT_MS = 2800

function waitAtMost(promise, milliseconds) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, milliseconds)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// Persistence is useful, but it is not allowed to block the game. Some iOS
// Safari/private-mode environments can reject or delay storage initialization.
const persistencePromise = setPersistence(auth, browserLocalPersistence).catch(() => null)

export async function ensureAuthenticated() {
  await waitAtMost(persistencePromise, AUTH_READY_TIMEOUT_MS)

  if (auth.currentUser) return auth.currentUser

  // Give Firebase a short chance to restore an existing anonymous session.
  // If Safari delays it, continue with a fresh anonymous sign-in instead of
  // leaving the user on an endless "Connecting" screen.
  if (typeof auth.authStateReady === 'function') {
    await waitAtMost(auth.authStateReady().catch(() => null), AUTH_READY_TIMEOUT_MS)
  }

  if (auth.currentUser) return auth.currentUser

  const credential = await signInAnonymously(auth)
  return credential.user
}
