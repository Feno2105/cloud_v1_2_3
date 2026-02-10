import { db } from '../firebase'
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

const normalizePhoto = (docSnapOrData) => {
  const data = typeof docSnapOrData.data === 'function' ? docSnapOrData.data() : docSnapOrData
  const docId = typeof docSnapOrData.id === 'string' ? docSnapOrData.id : undefined
  const id_photo = data.Id_photo ?? data.id_photo ?? data.id ?? docId
  return {
    ...data,
    Id_photo: id_photo ? toStringId(id_photo) : undefined,
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

export const firebaseService = {

  // récupérer tous les problèmes
  getProblemes: async () => {
    const snapshot = await getDocs(collection(db, 'probleme_routier'))
    return snapshot.docs.map(d => normalizeProbleme(d)).filter(p => p.Id_probleme)
  },

  // ajouter ou mettre à jour un problème
  addOrUpdateProbleme: async (probleme) => {
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
    const snapshot = await getDocs(collection(db, 'signalement'))
    return snapshot.docs.map(d => normalizeSignalement(d)).filter(s => s.Id_signalement)
  },

  addOrUpdateSignalement: async (signalement) => {
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
    const snapshot = await getDocs(collection(db, 'users'))
    return snapshot.docs.map(d => normalizeUser(d)).filter(u => u.Id_utilisateur)
  },

  addOrUpdateUser: async (user) => {
    const normalized = normalizeUser(user)
    const id = normalized.Id_utilisateur
    if (!id) return null
    await setDoc(doc(db, 'users', id), cleanUndefined(normalized), { merge: true })
    return id
  },

  migrateUserId: async (oldId, newId, user) =>
    migrateDocId('users', oldId, newId, user),

  // récupérer photos
  getPhotos: async () => {
    const snapshot = await getDocs(collection(db, 'photo'))
    return snapshot.docs.map(d => normalizePhoto(d)).filter(p => p.Id_photo)
  },

  addOrUpdatePhoto: async (photo) => {
    const normalized = normalizePhoto(photo)
    const id = normalized.Id_photo
    if (!id) return null
    await setDoc(doc(db, 'photo', id), cleanUndefined(normalized), { merge: true })
    return id
  },

  deletePhoto: async (id) => {
    const normalizedId = toStringId(id)
    if (!normalizedId) return
    await deleteDoc(doc(db, 'photo', normalizedId))
  },

  migratePhotoId: async (oldId, newId, photo) =>
    migrateDocId('photo', oldId, newId, photo),

}
