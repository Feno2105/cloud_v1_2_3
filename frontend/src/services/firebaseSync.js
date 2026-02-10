// services/firebaseSync.js
import { firebaseService } from './firebaseService';
import { problemeService, userService, signalementService, roleService } from './api';

const toStringId = (value) => (value === undefined || value === null ? '' : String(value))

const toMillis = (raw) => {
  if (!raw) return 0
  if (raw instanceof Date) return raw.getTime()
  if (typeof raw === 'number') {
    return raw < 1000000000000 ? raw * 1000 : raw
  }
  if (typeof raw === 'string') {
    const ts = Date.parse(raw)
    return Number.isNaN(ts) ? 0 : ts
  }
  if (typeof raw.toDate === 'function') {
    return raw.toDate().getTime()
  }
  if (typeof raw.seconds === 'number') {
    return raw.seconds * 1000
  }
  return 0
}

const getUpdatedAt = (item) => {
  const raw = item.update_at || item.updated_at || item.updatedAt || item.date_signalement || item.create_at || item.created_at || item.createdAt
  return toMillis(raw)
}

const isDeleted = (item) => {
  if (!item) return false
  if (typeof item.is_deleted === 'boolean') return item.is_deleted
  if (typeof item.id_deleted === 'boolean') return item.id_deleted
  if (typeof item.is_deleted === 'number') return item.is_deleted === 1
  if (typeof item.id_deleted === 'number') return item.id_deleted === 1
  return false
}

const stripFields = (data, fields) =>
  Object.fromEntries(
    Object.entries(data).filter(([key, value]) => !fields.includes(key) && value !== undefined)
  )

const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const shouldSync = (source, target, ignoreFields = []) => {
  const sourceTs = getUpdatedAt(source)
  const targetTs = getUpdatedAt(target)
  if (sourceTs > targetTs) return true
  if (sourceTs < targetTs) return false
  const sourcePayload = stableStringify(stripFields(source ?? {}, ignoreFields))
  const targetPayload = stableStringify(stripFields(target ?? {}, ignoreFields))
  return sourcePayload !== targetPayload
}

const nowIso = () => new Date().toISOString()

const getProblemeId = (p) => toStringId(p.Id_probleme ?? p.id_probleme ?? p.id)
const getSignalementId = (s) => toStringId(s.Id_signalement ?? s.id_signalement ?? s.id)
const getUserId = (u) => toStringId(u.Id_utilisateur ?? u.id ?? u.user_id ?? u.id_user)
const toNumberId = (value) => {
  if (value === undefined || value === null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const normalizePhotoList = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') return value.trim() ? [value] : []
  if (typeof value === 'object') return Object.values(value).filter(Boolean)
  return []
}

export const syncService = {

  // synchronisation complète
  syncAll: async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Aucune connexion internet')
      }
      console.log('🔄 Synchronisation commencée...');

      // 1️⃣ Problèmes routiers (Local -> Firebase, puis Firebase -> Local)
      const [apiProblemes, fbProblemes] = await Promise.all([
        problemeService.getAll(),
        firebaseService.getProblemes()
      ])
      const apiProblemesMap = new Map(apiProblemes.map(p => [getProblemeId(p), p]))
      const fbProblemesMap = new Map(fbProblemes.map(p => [getProblemeId(p), p]))

      for (const p of apiProblemes) {
        const id = getProblemeId(p)
        if (!id) continue
        const fb = fbProblemesMap.get(id)
        const localDeleted = isDeleted(p)
        const fbDeleted = isDeleted(fb)
        if (fb && fbDeleted && getUpdatedAt(fb) > getUpdatedAt(p)) {
          continue
        }
        if (!fb || shouldSync(p, fb, ['create_at', 'update_at', 'created_at', 'updated_at'])) {
          console.log('➕/🔁 Sync problème vers Firebase:', id)
          await firebaseService.addOrUpdateProbleme({ ...p, Id_probleme: id, is_deleted: localDeleted, update_at: nowIso() })
        }
      }

      for (const fp of fbProblemes) {
        const id = getProblemeId(fp)
        if (!id) continue
        const local = apiProblemesMap.get(id)
        const fbDeleted = isDeleted(fp)
        if (!local) {
          if (fbDeleted) continue
          console.log('➕ Sync problème vers API:', id)
          const payload = stripFields(fp, ['id', 'id_probleme', 'Id_probleme'])
          const created = await problemeService.create(payload)
          const localId = created?.Id_probleme ?? created?.id_probleme
          if (localId && toStringId(localId) !== toStringId(id)) {
            await firebaseService.migrateProblemeId(
              fp.__docId ?? id,
              toStringId(localId),
              { ...fp, Id_probleme: toStringId(localId), update_at: nowIso() }
            )
          }
        } else if (shouldSync(fp, local, ['create_at', 'update_at', 'created_at', 'updated_at'])) {
          if (fbDeleted) {
            console.log('🗑️ Suppression logique problème vers API:', id)
            await problemeService.update(id, { is_deleted: true })
            continue
          }
          console.log('🔁 Mise à jour problème vers API:', id)
          const payload = stripFields(fp, ['id', 'id_probleme', 'Id_probleme'])
          await problemeService.update(id, payload)
        }
      }

      // 2️⃣ Utilisateurs (Local -> Firebase, puis Firebase -> Local)
      const [apiUsers, fbUsers, roles] = await Promise.all([
        userService.getUsers(),
        firebaseService.getUsers(),
        roleService.getAll()
      ])
      const fbUsersMap = new Map(fbUsers.map(u => [getUserId(u), u]))
      const apiUsersMap = new Map(apiUsers.map(u => [getUserId(u), u]))
      const apiUsersByFireId = new Map(
        apiUsers
          .filter(u => u?.fire_user_id)
          .map(u => [String(u.fire_user_id), u])
      )
      const apiUsersByEmail = new Map(
        apiUsers
          .filter(u => u?.email)
          .map(u => [String(u.email).toLowerCase(), u])
      )
      const rolesMap = new Map(roles.map(role => [toStringId(role.Id_role ?? role.id), role]))

      for (const u of apiUsers) {
        const id = getUserId(u)
        if (!id) continue
        const fb = fbUsersMap.get(id)
        const localDeleted = isDeleted(u)
        const fbDeleted = isDeleted(fb)
        if (fb && fbDeleted && getUpdatedAt(fb) > getUpdatedAt(u)) {
          continue
        }
        const role = rolesMap.get(toStringId(u.Id_role))
        const enrichedUser = role
          ? { ...u, role: { ...role }, role_libelle: role.libelle, niveau: role.niveau }
          : u

        if (!fb || shouldSync(enrichedUser, fb, ['create_at', 'update_at', 'created_at', 'updated_at'])) {
          console.log('➕/🔁 Sync user vers Firebase:', u.email)
          await firebaseService.addOrUpdateUser({ ...enrichedUser, Id_utilisateur: id, id_deleted: localDeleted, update_at: nowIso() })
        }
      }

      for (const fu of fbUsers) {
        const id = getUserId(fu)
        if (!id) continue
        const local = apiUsersMap.get(id)
        const fbDeleted = isDeleted(fu)
        if (!local) {
          if (fbDeleted) continue
          console.log('➕ Sync user vers API:', id)
          const payload = stripFields(fu, ['id', 'Id_utilisateur'])
          if (!payload?.mdp || !payload?.Id_role) {
            console.warn('⚠️ Données utilisateur incomplètes, création ignorée:', id)
            continue
          }
          const created = await userService.createUser(payload)
          const localId = created?.Id_utilisateur ?? created?.id_utilisateur
          if (localId && toStringId(localId) !== toStringId(id)) {
            await firebaseService.migrateUserId(
              fu.__docId ?? id,
              toStringId(localId),
              { ...fu, Id_utilisateur: toStringId(localId), update_at: nowIso() }
            )
          }
        } else if (shouldSync(fu, local, ['create_at', 'update_at', 'created_at', 'updated_at'])) {
          if (fbDeleted) {
            console.log('🗑️ Suppression logique user vers API:', id)
            await userService.updateUser(id, { id_deleted: true })
            continue
          }
          console.log('🔁 Mise à jour user vers API:', id)
          const payload = stripFields(fu, ['id', 'Id_utilisateur'])
          try {
            await userService.updateUser(id, payload)
          } catch (updateError) {
            const status = updateError?.response?.status
            if (status === 404) {
              console.warn('⚠️ User introuvable côté API, création à la place:', id)
              if (!payload?.mdp || !payload?.Id_role) {
                console.warn('⚠️ Données utilisateur incomplètes, création ignorée:', id)
                continue
              }
              const created = await userService.createUser(payload)
              const localId = created?.Id_utilisateur ?? created?.id_utilisateur
              if (localId && toStringId(localId) !== toStringId(id)) {
                await firebaseService.migrateUserId(
                  fu.__docId ?? id,
                  toStringId(localId),
                  { ...fu, Id_utilisateur: toStringId(localId), update_at: nowIso() }
                )
              }
            } else {
              throw updateError
            }
          }
        }
      }

      // 3️⃣ Signalements (Local -> Firebase, puis Firebase -> Local)
      const [apiSignalements, fbSignalements] = await Promise.all([
        signalementService.getAll(),
        firebaseService.getSignalements()
      ])
      console.log('📥 Signalements Firebase:', fbSignalements.length)
      const apiSignalementsMap = new Map(apiSignalements.map(s => [getSignalementId(s), s]))
      const fbSignalementsMap = new Map(fbSignalements.map(s => [getSignalementId(s), s]))

      const resolveUtilisateurId = (signalement) => {
        const direct = getUserId(signalement)
        if (direct && apiUsersMap.has(direct)) return direct
        const fireId = signalement?.fire_user_id || signalement?.utilisateur?.fire_user_id
        if (fireId && apiUsersByFireId.has(String(fireId))) {
          return getUserId(apiUsersByFireId.get(String(fireId)))
        }
        const email = signalement?.email || signalement?.utilisateur?.email
        if (email && apiUsersByEmail.has(String(email).toLowerCase())) {
          return getUserId(apiUsersByEmail.get(String(email).toLowerCase()))
        }
        return null
      }

      const resolveStatusId = (signalement) =>
        signalement?.Id_status ??
        signalement?.id_status ??
        signalement?.status?.Id_status ??
        signalement?.status?.id ??
        1

      for (const s of apiSignalements) {
        const id = getSignalementId(s)
        if (!id) continue
        const fb = fbSignalementsMap.get(id)
        const localDeleted = isDeleted(s)
        const fbDeleted = isDeleted(fb)
        if (fb && fbDeleted && getUpdatedAt(fb) > getUpdatedAt(s)) {
          continue
        }
        if (!fb || shouldSync(s, fb, ['create_at', 'update_at', 'created_at', 'updated_at'])) {
          console.log('➕/🔁 Sync signalement vers Firebase:', id)
          await firebaseService.addOrUpdateSignalement({ ...s, Id_signalement: id, is_deleted: localDeleted, update_at: nowIso() })
        }
      }

      for (const fs of fbSignalements) {
        const id = getSignalementId(fs)
        if (!id) continue
        const local = apiSignalementsMap.get(id)
        const fbDeleted = isDeleted(fs)
        if (!local) {
          if (fbDeleted) continue
          console.log('➕ Sync signalement vers API:', id)
          const payload = stripFields(fs, ['id', 'id_signalement', 'Id_signalement', 'status', 'utilisateur'])
          const resolvedUserId = resolveUtilisateurId(fs)
          if (!resolvedUserId) {
            console.warn('⚠️ Utilisateur introuvable pour le signalement, création ignorée:', id)
            continue
          }
          payload.Id_utilisateur = toNumberId(resolvedUserId)
          payload.Id_status = toNumberId(resolveStatusId(fs)) ?? 1
          if (!payload.Id_utilisateur || !payload.Id_status) {
            console.warn('⚠️ Signalement ignoré (Id requis manquant):', id, payload)
            continue
          }
          let created
          try {
            created = await signalementService.create(payload)
          } catch (error) {
            console.error('❌ Erreur lors de la création du signalement (payload):', payload)
            console.error('❌ Détails:', error?.response?.data || error)
            throw error
          }
          const localId = created?.Id_signalement ?? created?.id_signalement
          if (localId && toStringId(localId) !== toStringId(id)) {
            await firebaseService.migrateSignalementId(
              fs.__docId ?? id,
              toStringId(localId),
              { ...fs, Id_signalement: toStringId(localId), update_at: nowIso() }
            )
          }
          const photos = normalizePhotoList(fs.photos ?? fs.photo ?? fs.images ?? fs.image ?? fs.urls ?? fs.url)
          if (photos.length && localId) {
            await signalementService.syncPhotos(toStringId(localId), photos)
          }
        } else if (shouldSync(fs, local, ['create_at', 'update_at', 'created_at', 'updated_at'])) {
          if (fbDeleted) {
            console.log('🗑️ Suppression logique signalement vers API:', id)
            await signalementService.update(id, { is_deleted: true })
            continue
          }
          console.log('🔁 Mise à jour signalement vers API:', id)
          const payload = stripFields(fs, ['id', 'id_signalement', 'Id_signalement', 'status', 'utilisateur'])
          const resolvedUserId = resolveUtilisateurId(fs)
          if (resolvedUserId) payload.Id_utilisateur = toNumberId(resolvedUserId)
          if (!payload.Id_status) payload.Id_status = toNumberId(resolveStatusId(fs)) ?? 1
          try {
            await signalementService.update(id, payload)
          } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du signalement (payload):', payload)
            console.error('❌ Détails:', error?.response?.data || error)
            throw error
          }
          const photos = normalizePhotoList(fs.photos ?? fs.photo ?? fs.images ?? fs.image ?? fs.urls ?? fs.url)
          if (photos.length) {
            await signalementService.syncPhotos(id, photos)
          }
        }
      }

      console.log('✅ Synchronisation terminée !');
      return {
        fbSignalements: fbSignalements.length,
        apiSignalements: apiSignalements.length,
        syncedAt: nowIso()
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation Firebase:', error);
      throw error
    }
  }
};
