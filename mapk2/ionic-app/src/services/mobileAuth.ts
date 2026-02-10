import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { auth, db } from '../firebase'

let cachedProfile: Record<string, any> | null = null

export const getCurrentUser = () =>
  new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })

export const getCachedProfile = () => cachedProfile

const normalizeRoleLabel = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

export const isMobileAuthorized = (profile?: Record<string, any> | null) => {
  if (!profile) return true
  const roleLabel = normalizeRoleLabel(
    profile.role?.libelle ?? profile.role_libelle ?? profile.role
  )
  const niveau = Number(profile.role?.niveau ?? profile.niveau)
  return roleLabel == 'UTILISATEUR' || (Number.isFinite(niveau) && niveau >= 1 && niveau <= 10)
}

export const fetchUserProfile = async (user: User) => {
  const usersRef = collection(db, 'users')
  const queries = [
    query(usersRef, where('fire_user_id', '==', user.uid), limit(1)),
    query(usersRef, where('email', '==', user.email ?? ''), limit(1))
  ]

  for (const q of queries) {
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      cachedProfile = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      return cachedProfile
    }
  }

  cachedProfile = null
  return null
}

export const logoutMobile = async () => {
  cachedProfile = null
  await signOut(auth)
}
