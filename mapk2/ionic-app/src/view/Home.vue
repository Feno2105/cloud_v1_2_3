<template>
  <ion-page class="home-page">
    <ion-header>
      <ion-toolbar class="home-toolbar">
        <ion-title>Signaler une dégradation</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="handleLogout">Déconnexion</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" class="home-content">
      <div class="home-wrapper">
        <section v-show="activeSection === 'map'" id="section-map" class="section-block">
        <ion-card class="neon-card">
          <ion-card-header>
            <ion-card-title>Carte des signalements</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="filter-row">
              <ion-button
                size="small"
                class="neon-button secondary"
                :class="{ active: mapFilterMode === 'all' }"
                @click="setMapFilter('all')"
              >
                Tous
              </ion-button>
              <ion-button
                size="small"
                class="neon-button secondary"
                :class="{ active: mapFilterMode === 'mine' }"
                @click="setMapFilter('mine')"
              >
                Mes signalements
              </ion-button>
            </div>
            <div ref="mapContainer" class="map-container"></div>
            <div v-if="isPicking" class="map-picker">
              <p v-if="pendingPosition" class="muted">Position choisie: {{ pendingPosition.lat }}, {{ pendingPosition.lng }}</p>
              <p v-else class="muted">Cliquez sur la carte pour choisir l’emplacement.</p>
              <ion-button
                expand="block"
                class="neon-button"
                :disabled="!pendingPosition"
                @click="validatePosition"
              >
                Valider la position
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
        </section>

        <section v-show="activeSection === 'signal'" id="section-signal" class="section-block">
        <ion-card class="neon-card">
          <ion-card-header>
            <ion-card-title>Ma position</ion-card-title>
            <ion-card-subtitle>GPS requis</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p v-if="position">Lat: {{ position.lat }}, Lng: {{ position.lng }}</p>
            <p v-else class="muted">Position non disponible</p>
            <div class="button-stack">
              <ion-button expand="block" class="neon-button secondary" @click="openMapPicker">
                Ouvrir la carte à la position
              </ion-button>
            </div>
            <p v-if="showMapHint" class="muted">Cliquez sur la carte pour choisir l’emplacement.</p>
          </ion-card-content>
        </ion-card>

        <ion-card class="neon-card">
          <ion-card-header>
            <ion-card-title>Nouveau signalement</ion-card-title>
            <ion-card-subtitle>Envoyé immédiatement vers Firebase</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-item lines="none" class="neon-item">
              <ion-textarea
                v-model="commentaire"
                label="Commentaire"
                label-placement="stacked"
                auto-grow
              />
            </ion-item>

            <!-- Photo upload section -->
            <div class="photo-section">
              <ion-button expand="block" class="neon-button secondary" @click="openAddPhotoOptions">
                Ajouter des photos
              </ion-button>

              <ion-text v-if="!cloudinaryConfigured" class="feedback" color="warning">
                Cloudinary non configuré. Renseigne
                <strong>VITE_CLOUDINARY_CLOUD_NAME</strong> et
                <strong>VITE_CLOUDINARY_UPLOAD_PRESET</strong> dans `.env`.
              </ion-text>

              <div v-if="showPhotoOptions" class="photo-options">
                <ion-button
                  expand="block"
                  class="neon-button"
                  :disabled="!cloudinaryConfigured"
                  @click="pickFromGallery"
                >Depuis la galerie</ion-button>
                <ion-button
                  expand="block"
                  class="neon-button"
                  :disabled="!cloudinaryConfigured"
                  @click="takePhoto"
                >Prendre une photo</ion-button>
                <ion-button expand="block" class="neon-button secondary" @click="showPhotoOptions = false">Annuler</ion-button>
              </div>

              <!-- hidden inputs: gallery and camera (capture) -->
              <input ref="fileInputGallery" style="display:none" type="file" accept="image/*" multiple @change="onFilesSelected" />
              <input ref="fileInputCamera" style="display:none" type="file" accept="image/*" capture="environment" multiple @change="onFilesSelected" />

              <div v-if="photoPreviews.length" class="photo-previews">
                <div class="preview-item" v-for="(src, idx) in photoPreviews" :key="idx">
                  <img :src="src" alt="preview" />
                  <ion-button size="small" class="neon-button secondary" @click="removePhotoAt(idx)">Retirer</ion-button>
                </div>
              </div>

              <div v-if="isUploading" class="upload-status">
                <ion-progress-bar :value="uploadProgress / 100" color="secondary"></ion-progress-bar>
                <ion-text class="muted">{{ uploadStatus }} ({{ uploadProgress }}%)</ion-text>
              </div>

              <ion-text v-if="uploadError" class="feedback" color="danger">
                {{ uploadError }}
              </ion-text>
            </div>

            <ion-button
              expand="block"
              class="neon-button"
              :disabled="loading || !position"
              @click="submitSignalement"
            >
              {{ loading ? 'Envoi...' : 'Signaler' }}
            </ion-button>

            <ion-text v-if="message" class="feedback" :color="messageType">
              {{ message }}
            </ion-text>
          </ion-card-content>
        </ion-card>
        </section>

        <section v-show="activeSection === 'info'" id="section-info" class="section-block info-section">
          <div class="info-wrapper">
            <ion-card class="neon-card info-card">
              <ion-card-header>
                <ion-card-title>Mes signalements</ion-card-title>
                <ion-card-subtitle>Historique et localisation</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div v-if="!mySignalements.length" class="empty-state">
                  <p>Aucun signalement pour le moment.</p>
                  <p class="muted">Créez un signalement depuis l’onglet Signaler.</p>
                </div>
                <ion-list v-else class="neon-list info-list">
                  <ion-item v-for="item in mySignalements" :key="item.id" class="neon-item info-item" lines="none">
                    <ion-label class="info-label">
                      <div class="info-row">
                        <h3>{{ item.commentaire || 'Sans commentaire' }}</h3>
                        <span class="info-date">{{ formatDate(item.update_at || item.create_at) }}</span>
                      </div>
                      <div class="info-detail">
                        <span class="info-detail-label">Position</span>
                        <span class="info-detail-value">{{ item.position_ }}</span>
                      </div>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </div>
        </section>
      </div>
    </ion-content>

    <ion-footer class="bottom-nav">
      <ion-toolbar class="bottom-toolbar">
        <ion-buttons class="bottom-buttons">
          <ion-button class="bottom-button" :class="{ active: activeSection === 'map' }" @click="setSection('map')">Carte</ion-button>
          <ion-button class="bottom-button" :class="{ active: activeSection === 'signal' }" @click="setSection('signal')">Signaler</ion-button>
          <ion-button class="bottom-button" :class="{ active: activeSection === 'info' }" @click="setSection('info')">Information</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>

  <ion-modal :is-open="showImageModal" @didDismiss="showImageModal = false" class="image-modal">
    <div class="image-modal-content" @click="showImageModal = false">
      <img :src="selectedImage" alt="photo" @click.stop />
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { fetchUserProfile, getCachedProfile, getCurrentUser, logoutMobile } from '../services/mobileAuth'
import L from 'leaflet'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonTextarea,
  IonText,
  IonList,
  IonLabel,
  IonProgressBar,
  IonModal
  
} from '@ionic/vue'

defineOptions({ name: 'HomeView' })

const router = useRouter()
const position = ref<{ lat: number; lng: number } | null>(null)
const commentaire = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref<'success' | 'danger'>('success')
const showPhotoOptions = ref(false)
const fileInputGallery = ref<HTMLInputElement | null>(null)
const fileInputCamera = ref<HTMLInputElement | null>(null)
const photosFiles = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const uploadProgress = ref(0)
const uploadStatus = ref('')
const uploadError = ref('')
const isUploading = ref(false)
const showImageModal = ref(false)
const selectedImage = ref('')
const mySignalements = ref<any[]>([])
const allSignalements = ref<any[]>([])
const mapFilterMode = ref<'all' | 'mine'>('all')
const contentRef = ref<any>(null)
const activeSection = ref<'map' | 'signal' | 'info'>('map')
const showMapHint = ref(true)
const mapContainer = ref<HTMLDivElement | null>(null)
const pendingPosition = ref<{ lat: number; lng: number } | null>(null)
const isPicking = ref(true)
let map: any | null = null
let markersLayer: any | null = null
const tileServerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const normalizeUserIdValue = (raw: unknown) => {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') return raw
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  const asNumber = Number(trimmed)
  return Number.isFinite(asNumber) && String(asNumber) === trimmed ? asNumber : trimmed
}

const getProfileUserId = (profile: Record<string, any> | null | undefined) => {
  const raw =
    profile?.Id_utilisateur ??
    profile?.id_utilisateur ??
    profile?.id ??
    profile?.user_id ??
    profile?.id_user
  const normalized = normalizeUserIdValue(raw)
  if (normalized === null || normalized === undefined) {
    return { raw: null, userIdStr: null as string | null, userIdNum: null as number | null }
  }
  const userIdStr = String(normalized)
  const userIdNum = typeof normalized === 'number' ? normalized : Number(userIdStr)
  return {
    raw: normalized,
    userIdStr,
    userIdNum: Number.isFinite(userIdNum) ? userIdNum : null
  }
}

const matchesUser = (item: Record<string, any>, userIdStr: string | null, userIdNum: number | null) => {
  const candidate =
    item?.Id_utilisateur ??
    item?.id_utilisateur ??
    item?.user_id ??
    item?.id_user
  if (candidate === null || candidate === undefined) return false
  if (userIdStr && String(candidate) === userIdStr) return true
  if (userIdNum !== null && Number(candidate) === userIdNum) return true
  return false
}

const ensureProfile = async () => {
  const current = auth.currentUser ?? (await getCurrentUser())
  if (!current) return null
  return (await fetchUserProfile(current)) ?? getCachedProfile()
}

const getPosition = async () => {
  if (!navigator.onLine) {
    message.value = 'Connexion internet requise.'
    messageType.value = 'danger'
    return
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const permStatus = await Geolocation.checkPermissions()
      if (permStatus.location !== 'granted') {
        const reqStatus = await Geolocation.requestPermissions({ permissions: ['location'] })
        if (reqStatus.location !== 'granted') {
          message.value = 'Autorisation de localisation requise.'
          messageType.value = 'danger'
          return
        }
      }

      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
      position.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } else {
      if (!navigator.geolocation) {
        message.value = 'Géolocalisation non supportée.'
        messageType.value = 'danger'
        return
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      })
      position.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    }

    pendingPosition.value = position.value
    isPicking.value = false
    updateMarkers()
    map?.setView([position.value.lat, position.value.lng], 15, { animate: true })
    message.value = ''
  } catch {
    message.value = 'Impossible de récupérer la position.'
    messageType.value = 'danger'
  }
}

const submitSignalement = async () => {
  if (!position.value) return
  if (!navigator.onLine) {
    message.value = 'Connexion internet requise.'
    messageType.value = 'danger'
    return
  }

  loading.value = true
  try {
    const profile = await ensureProfile()
    const { raw: profileUserId } = getProfileUserId(profile)
    if (!profileUserId) {
      throw new Error('Profil utilisateur introuvable.')
    }

    // upload photos to Cloudinary (if any)
    const photoUrls: string[] = []
    if (photosFiles.value.length) {
      isUploading.value = true
      uploadProgress.value = 0
      uploadStatus.value = 'Upload des photos...'
      uploadError.value = ''

      const total = photosFiles.value.length
      for (let i = 0; i < total; i++) {
        const f = photosFiles.value[i]
        try {
          const url = await uploadToCloudinary(f, (progress) => {
            const overall = ((i + progress / 100) / total) * 100
            uploadProgress.value = Math.round(overall)
          })
          if (url) photoUrls.push(url)
        } catch (e) {
          console.error('Upload failed for file', f, e)
          uploadError.value =
            (e as Error)?.message || 'Une ou plusieurs photos n\'ont pas pu être uploadées.'
        }
      }
    }

    const payload = {
      position_: `${position.value.lat},${position.value.lng}`,
      commentaire: commentaire.value,
      is_deleted: false,
      Id_status: 1,
      Id_utilisateur: profileUserId,
      photos: photoUrls,
      create_at: new Date().toISOString(),
      update_at: new Date().toISOString()
    }

    const ref = doc(collection(db, 'signalement'))
    await setDoc(ref, { ...payload, Id_signalement: ref.id })

    commentaire.value = ''
    photosFiles.value = []
    photoPreviews.value = []
    message.value = 'Signalement envoyé ✅'
    messageType.value = 'success'
    await loadMySignalements()
    await loadAllSignalements()
  } catch (err: any) {
    message.value = err?.message || 'Erreur lors de l\'envoi.'
    messageType.value = 'danger'
  } finally {
    loading.value = false
    isUploading.value = false
    uploadStatus.value = ''
  }
}

// Cloudinary unsigned upload helper
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`
const cloudinaryConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)

const uploadToCloudinary = (file: File, onProgress?: (progress: number) => void) =>
  new Promise<string>((resolve, reject) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      reject(new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET'))
      return
    }
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', CLOUDINARY_UPLOAD_URL)
    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return
      const progress = Math.round((evt.loaded / evt.total) * 100)
      onProgress?.(progress)
    }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('Upload failed'))
        return
      }
      try {
        const data = JSON.parse(xhr.responseText)
        resolve(data.secure_url as string)
      } catch (err) {
        reject(err)
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(form)
  })

const onFilesSelected = (ev: Event) => {
  const input = ev.target as HTMLInputElement
  if (!input?.files) return
  handleFiles(Array.from(input.files))
  // clear the input to allow re-selecting same files later
  input.value = ''
}

const handleFiles = (files: File[]) => {
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue
    photosFiles.value.push(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) photoPreviews.value.push(String(e.target.result))
    }
    reader.readAsDataURL(f)
  }
}

const addFileFromUri = async (uri: string, filename?: string) => {
  const response = await fetch(uri)
  const blob = await response.blob()
  const name = filename ?? `photo-${Date.now()}.jpg`
  const file = new File([blob], name, { type: blob.type || 'image/jpeg' })
  handleFiles([file])
}

const pickNativeGallery = async () => {
  const result = await Camera.pickImages({ quality: 80, limit: 10 })
  for (const photo of result.photos) {
    if (photo.webPath) {
      await addFileFromUri(photo.webPath, `gallery-${Date.now()}.${photo.format || 'jpg'}`)
    }
  }
}

const takeNativePhoto = async () => {
  await Camera.requestPermissions({ permissions: ['camera', 'photos'] })
  const photo = await Camera.getPhoto({
    quality: 80,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera
  })
  if (photo.webPath) {
    await addFileFromUri(photo.webPath, `camera-${Date.now()}.jpg`)
  }
}

const openAddPhotoOptions = () => {
  showPhotoOptions.value = true
}

const pickFromGallery = () => {
  showPhotoOptions.value = false
  if (Capacitor.isNativePlatform()) {
    pickNativeGallery().catch((err) => {
      console.error(err)
      uploadError.value = 'Impossible d\'ouvrir la galerie.'
    })
    return
  }
  fileInputGallery.value?.click()
}

const takePhoto = () => {
  showPhotoOptions.value = false
  if (!Capacitor.isNativePlatform()) {
    // web fallback: capture input (camera on mobile browsers)
    fileInputCamera.value?.click()
    return
  }
  takeNativePhoto().catch((err) => {
    console.error(err)
    uploadError.value = 'Impossible d\'ouvrir la caméra.'
  })
}

const removePhotoAt = (index: number) => {
  photosFiles.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

const loadMySignalements = async () => {
  try {
    const profile = await ensureProfile()
    const { userIdStr, userIdNum } = getProfileUserId(profile)
    if (!userIdStr && userIdNum === null) return

    if (!allSignalements.value.length) {
      await loadAllSignalements()
      return
    }

    mySignalements.value = allSignalements.value.filter((item) =>
      matchesUser(item, userIdStr, userIdNum)
    )
    updateMarkers()
  } catch (err: any) {
    message.value = err?.message || 'Erreur lors du chargement des signalements.'
    messageType.value = 'danger'
  }
}

const loadAllSignalements = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'signalement'))
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    allSignalements.value = items

    const profile = await ensureProfile()
    const { userIdStr, userIdNum } = getProfileUserId(profile)
    if (userIdStr || userIdNum !== null) {
      mySignalements.value = items.filter((item) => matchesUser(item, userIdStr, userIdNum))
    }

    updateMarkers()
  } catch (err: any) {
    message.value = err?.message || 'Erreur lors du chargement des signalements.'
    messageType.value = 'danger'
  }
}

const formatDate = (raw?: string) => {
  if (!raw) return '—'
  return new Date(raw).toLocaleString('fr-FR')
}

const handleLogout = async () => {
  await logoutMobile()
  router.replace('/login')
}

const handleOfflineRedirect = async () => {
  if (navigator.onLine) return
  message.value = 'verifie votre connexion internet'
  messageType.value = 'danger'
  await logoutMobile()
  router.replace('/login')
}

const openMapPicker = async () => {
  showMapHint.value = true
  isPicking.value = true
  setSection('map')
  if (!position.value) {
    await getPosition()
  } else {
    pendingPosition.value = position.value
    map?.setView([position.value.lat, position.value.lng], 15, { animate: true })
  }
}

const validatePosition = () => {
  if (!pendingPosition.value) return
  position.value = { ...pendingPosition.value }
  isPicking.value = false
  showMapHint.value = false
  updateMarkers()
  setSection('signal')
}

const setMapFilter = (mode: 'all' | 'mine') => {
  mapFilterMode.value = mode
  updateMarkers()
}

const setSection = (section: 'map' | 'signal' | 'info') => {
  activeSection.value = section
  if (section === 'map') {
    setTimeout(() => {
      map?.invalidateSize()
      if (position.value) {
        map?.setView([position.value.lat, position.value.lng], 15, { animate: true })
      }
    }, 200)
  }
}

const initMap = () => {
  if (!mapContainer.value || map) return
  map = L.map(mapContainer.value, {
    preferCanvas: true,
    zoomControl: false,
    zoomSnap: 1,
    zoomDelta: 1,
    updateWhenIdle: true,
    updateWhenZooming: false
  }).setView([-18.8792, 47.5079], 13)

  L.tileLayer(tileServerUrl, {
    maxZoom: 18,
    minZoom: 10,
    attribution: '&copy; OpenStreetMap contributors',
    keepBuffer: 2,
    updateWhenIdle: true
  }).addTo(map)

  markersLayer = L.layerGroup().addTo(map)
  map.on('click', (event: any) => {
    if (!event?.latlng) return
    if (!isPicking.value) return
    pendingPosition.value = { lat: event.latlng.lat, lng: event.latlng.lng }
    updateMarkers()
    showMapHint.value = false
  })
  map.on('popupopen', (event: any) => {
    const popupEl = event?.popup?.getElement?.()
    if (!popupEl) return
    const images = popupEl.querySelectorAll('img[data-photo]')
    images.forEach((img: any) => {
      img.addEventListener('click', () => {
        const url = img.getAttribute('data-photo')
        if (!url) return
        selectedImage.value = url
        showImageModal.value = true
      })
    })
  })
  updateMarkers()
}

const updateMarkers = () => {
  if (!markersLayer) return
  markersLayer.clearLayers()

  if (position.value) {
    L.marker([position.value.lat, position.value.lng])
      .bindPopup('📍 Vous êtes ici')
      .addTo(markersLayer)
  }

  if (pendingPosition.value && (!position.value || isPicking.value)) {
    L.marker([pendingPosition.value.lat, pendingPosition.value.lng])
      .bindPopup('📌 Position sélectionnée')
      .addTo(markersLayer)
  }

  const items = mapFilterMode.value === 'all' ? allSignalements.value : mySignalements.value
  const extractPhotoList = (value: any) => {
    if (!value) return [] as string[]
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') return value.trim() ? [value] : []
    if (typeof value === 'object') return Object.values(value).filter(Boolean) as string[]
    return [] as string[]
  }

  items.forEach((item) => {
    if (!item.position_) return
    const [latRaw, lngRaw] = String(item.position_).split(',')
    const lat = parseFloat(latRaw)
    const lng = parseFloat(lngRaw)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const photoList = extractPhotoList(
      item.photos ?? item.photo ?? item.images ?? item.image ?? item.urls ?? item.url
    )
    const photosCountLine = `<br />Photos: ${photoList.length}`
    const photosHtml = photoList.length
      ? `
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
          ${photoList
            .map(
              (url: string) =>
                `<img data-photo="${url}" src="${url}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid rgba(148,163,184,0.25);cursor:pointer" />`
            )
            .join('')}
        </div>
      `
      : ''
    const statusLabel =
      item?.status?.libelle ??
      item?.status?.label ??
      item?.status?.name ??
      (item?.Id_status ? `Statut #${item.Id_status}` : 'En attente de synchronisation')
    const createdAt = item?.create_at ? formatDate(item.create_at) : '—'
    const popup = `
      <div>
        <strong>Signalement</strong><br />
        ${item.commentaire ? item.commentaire : 'Sans commentaire'}<br />
        Statut: ${statusLabel}<br />
        Créé le: ${createdAt}
        ${photosCountLine}
        ${photosHtml}
      </div>
    `
    L.marker([lat, lng]).bindPopup(popup).addTo(markersLayer)
  })
}

const onMountedHandler = async () => {
  await handleOfflineRedirect()
  if (!navigator.onLine) return
  initMap()
  await loadMySignalements()
  await loadAllSignalements()
  await openMapPicker()
  window.addEventListener('offline', handleOfflineRedirect)
}

onMounted(onMountedHandler)
</script>

<style scoped>
.home-page {
  --background: radial-gradient(circle at top, #0f172a, #020617 65%);
}

.home-toolbar {
  --background: rgba(15, 23, 42, 0.95);
  --color: #f8fafc;
}

.home-content {
  --background: transparent;
}

.home-wrapper {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem 1.5rem 5.5rem;
}

.map-container {
  width: 100%;
  height: 480px;
  border-radius: 16px;
  overflow: hidden;
}

.filter-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.neon-button.secondary.active {
  --background: linear-gradient(120deg, #38bdf8, #8b5cf6);
  --color: #0b1120;
}

.map-picker {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}

.neon-card {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.45);
  color: #e2e8f0;
}

.neon-button {
  --background: linear-gradient(120deg, #38bdf8, #8b5cf6);
  --color: #0b1120;
  font-weight: 700;
  margin-top: 0.75rem;
}

.neon-button.secondary {
  --background: rgba(148, 163, 184, 0.2);
  --color: #e2e8f0;
}

.button-stack {
  display: grid;
  gap: 0.75rem;
}

.photo-section {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.photo-options {
  display: grid;
  gap: 0.5rem;
}
.photo-previews {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.upload-status {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.image-modal::part(content) {
  --background: rgba(2, 6, 23, 0.85);
}

.image-modal-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.image-modal-content img {
  max-width: 92vw;
  max-height: 92vh;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.preview-item {
  width: 100px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}
.preview-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.neon-item {
  --background: rgba(15, 23, 42, 0.8);
  --border-radius: 12px;
  --border-color: rgba(148, 163, 184, 0.2);
  --color: #e2e8f0;
}

.neon-list {
  background: transparent;
}

.info-section {
  display: flex;
  justify-content: center;
}

.info-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.info-card {
  width: 100%;
  max-width: 560px;
}

.info-list {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.7);
  --inner-padding-end: 12px;
  --inner-padding-start: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.info-label {
  display: grid;
  gap: 0.35rem;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.info-date {
  font-size: 0.8rem;
  color: #94a3b8;
}

.info-detail {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-top: 0.5rem;
}

.info-detail-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.info-detail-value {
  font-size: 0.9rem;
  color: #cbd5f5;
}

.empty-state {
  text-align: center;
  padding: 1rem 0.5rem;
}

.feedback {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}

.muted {
  color: #94a3b8;
}

.bottom-nav {
  --background: rgba(15, 23, 42, 0.95);
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.bottom-toolbar {
  --background: rgba(15, 23, 42, 0.95);
}

.bottom-buttons {
  display: flex;
  width: 100%;
  justify-content: space-around;
}

.bottom-button {
  --color: #e2e8f0;
  font-weight: 600;
}

.bottom-button.active {
  --color: #38bdf8;
  font-weight: 700;
}
</style>
