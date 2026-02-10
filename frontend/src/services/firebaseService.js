import { auth, db } from '../firebase'
import { signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore'

const cleanUndefined = (data) =>
  Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && !key.startsWith('__'))
  )

const toStringId = (value) => (value === undefined || value === null ? '' : String(value))

const normalizeProbleme = (docSnapOrData) => {
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData
  const docId = typeof docSnapOrData.id === 'string' ? docSnapOrData.id : undefined
  const id_probleme = data.Id_probleme ?? data.id_probleme ?? data.id ?? docId
  return {
    ...data,
    Id_probleme: id_probleme ? toStringId(id_probleme) : undefined,
    __docId: docId
  }
}

const normalizeSignalement = (docSnapOrData) => {
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData
  const docId = typeof docSnapOrData.id === 'string' ? docSnapOrData.id : undefined
  const id_signalement = data.Id_signalement ?? data.id_signalement ?? data.id ?? docId
  return {
    ...data,
    Id_signalement: id_signalement ? toStringId(id_signalement) : undefined,
    __docId: docId
  }
}

const normalizeUser = (docSnapOrData) => {
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData
  const docId = typeof docSnapOrData.id === 'string' ? docSnapOrData.id : undefined
  const id = data.Id_utilisateur ?? data.id ?? data.user_id ?? data.id_user ?? docId
  return {
    ...data,
    Id_utilisateur: id ? toStringId(id) : undefined,
    __docId: docId
  }
}

const migrateDocId = async (collectionName, oldId, newId, data) => {
  if (!newId) return null
  const normalizedNewId = toStringId(newId)
  await setDoc(doc(db, collectionName, normalizedNewId), cleanUndefined(data), { merge: true })
  if (oldId && toStringId(oldId) !== normalizedNewId) {
    await deleteDoc(doc(db, collectionName, toStringId(oldId)))
  }
  return normalizedNewId
}

const getFirebaseSyncCredentials = () => {
  const email = import.meta.env.VITE_FIREBASE_SYNC_EMAIL
  const password = import.meta.env.VITE_FIREBASE_SYNC_PASSWORD
  return email && password ? { email, password } : null
}

const ensureFirebaseAuth = () =>
  new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve(auth.currentUser)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe()
      if (user) {
        resolve(user)
        return
      }
      try {
        const credential = await signInAnonymously(auth)
        resolve(credential.user)
      } catch (err) {
        const creds = getFirebaseSyncCredentials()
        if (!creds) {
          reject(err)
          return
        }
        try {
          const credential = await signInWithEmailAndPassword(auth, creds.email, creds.password)
          resolve(credential.user)
        } catch (authErr) {
          reject(authErr)
        }
      }
    })
  })

export const firebaseService = {

  // récupérer tous les problèmes
  getProblemes: async () => {
    await ensureFirebaseAuth()
    const snapshot = await getDocs(collection(db, 'probleme_routier'))
    return snapshot.docs.map(d => normalizeProbleme(d)).filter(p => p.Id_probleme)
  },

  // ajouter ou mettre à jour un problème
  addOrUpdateProbleme: async (probleme) => {
    await ensureFirebaseAuth()
    const normalized = normalizeProbleme(probleme)
    const id = normalized.Id_probleme
    if (!id) return null
    await setDoc(doc(db, 'probleme_routier', id), cleanUndefined(normalized), { merge: true })
    return id
  },

  migrateProblemeId: async (oldId, newId, probleme) =>
    migrateDocId('probleme_routier', oldId, newId, probleme),

  // récupérer tous les signalements
  getSignalements: async () => {
    await ensureFirebaseAuth()
    const snapshot = await getDocs(collection(db, 'signalement'))
    return snapshot.docs.map(d => normalizeSignalement(d)).filter(s => s.Id_signalement)
  },

  addOrUpdateSignalement: async (signalement) => {
    await ensureFirebaseAuth()
    const normalized = normalizeSignalement(signalement)
    const id = normalized.Id_signalement
    if (!id) return null
    await setDoc(doc(db, 'signalement', id), cleanUndefined(normalized), { merge: true })
    return id
  },

  migrateSignalementId: async (oldId, newId, signalement) =>
    migrateDocId('signalement', oldId, newId, signalement),

  // récupérer utilisateurs
  getUsers: async () => {
    await ensureFirebaseAuth()
    const snapshot = await getDocs(collection(db, 'users'))
    return snapshot.docs.map(d => normalizeUser(d)).filter(u => u.Id_utilisateur)
  },

  addOrUpdateUser: async (user) => {
    await ensureFirebaseAuth()
    const normalized = normalizeUser(user)
    const id = normalized.Id_utilisateur
    if (!id) return null
    await setDoc(doc(db, 'users', id), cleanUndefined(normalized), { merge: true })
    return id
  },

  migrateUserId: async (oldId, newId, user) =>
    migrateDocId('users', oldId, newId, user),

}
