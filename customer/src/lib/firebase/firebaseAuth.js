import { getApps, initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
} from 'firebase/auth'

/** @returns {import('firebase/app').FirebaseOptions} */
function getFirebaseOptions() {
  return {
    apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim(),
    authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim(),
    projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '').trim(),
    messagingSenderId: String(
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? ''
    ).trim(),
    appId: String(import.meta.env.VITE_FIREBASE_APP_ID ?? '').trim(),
  }
}

function assertFirebaseAuthReady() {
  const o = getFirebaseOptions()
  if (!o.apiKey || !o.authDomain || !o.projectId) {
    throw new Error(
      'Thiếu cấu hình Firebase. Thêm VITE_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID (và nên có APP_ID, MESSAGING_SENDER_ID) vào `.env` — xem `.env.example`.'
    )
  }
}

/** @returns {import('firebase/auth').Auth} */
function getFirebaseAuthSingleton() {
  assertFirebaseAuthReady()
  const options = getFirebaseOptions()
  if (!getApps().length) initializeApp(options)
  return getAuth()
}

/**
 * Đăng nhập Google qua Firebase Auth (popup), trả về **Google ID JWT** để POST `/api/store/auth/google` hoặc `/api/store/b2b/auth/google`.
 * @returns {Promise<string>}
 */
export async function signInWithGooglePopupAndGetIdToken() {
  const auth = getFirebaseAuthSingleton()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  let result
  try {
    result = await signInWithPopup(auth, provider)
  } catch (e) {
    if (
      typeof e === 'object' &&
      e !== null &&
      /** @type {{ code?: string }} */ (e).code === 'auth/popup-closed-by-user'
    ) {
      throw new Error('Đã đóng cửa sổ đăng nhập Google.')
    }
    throw e
  }

  const cred = GoogleAuthProvider.credentialFromResult(result)
  const idToken = cred?.idToken?.trim?.() ?? ''
  if (!idToken) {
    throw new Error(
      'Không lấy được Google ID token. Kiểm tra Google provider trong Firebase Console (Authentication → Sign-in method).'
    )
  }

  return idToken
}
