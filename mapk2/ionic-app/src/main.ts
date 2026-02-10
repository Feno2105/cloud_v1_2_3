import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { IonicVue } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { addNotification } from './services/notificationStore'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, limit, query, setDoc, where } from 'firebase/firestore'
import { auth, db } from './firebase'
import { updateFcmToken } from './services/backendApi'

/* CSS etc. */
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import './theme/variables.css';
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';
// main.ts ou main.js
import 'leaflet/dist/leaflet.css';




const app = createApp(App)
  .use(IonicVue)
  .use(router);

let pendingFcmToken: string | null = null

const syncFcmToken = async (token: string) => {
  const user = auth.currentUser
  if (!user?.uid) {
    pendingFcmToken = token
    return
  }

  try {
    await syncFcmTokenToFirestore(user.uid, token)
    await updateFcmToken({
      fire_user_id: user.uid,
      fcm_token: token
    })
    pendingFcmToken = null
  } catch (error) {
    console.error('❌ Erreur envoi fcm_token:', error)
  }
}

const syncFcmTokenToFirestore = async (fireUserId: string, token: string) => {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('fire_user_id', '==', fireUserId), limit(1))
  const snapshot = await getDocs(q)

  if (snapshot.empty) return

  const userDoc = snapshot.docs[0]
  await setDoc(userDoc.ref, { fcm_token: token }, { merge: true })
}

onAuthStateChanged(auth, (user) => {
  if (!user?.uid || !pendingFcmToken) return
  syncFcmToken(pendingFcmToken)
})

router.isReady().then(() => {
  app.mount('#app');

  if (Capacitor.isNativePlatform()) {
    // ------------------- PUSH NOTIFICATIONS -------------------
    
    // ⚡ 1️⃣ Ajoute tous les listeners avant register
    PushNotifications.addListener('registration', token => {
      console.log('TOKEN FCM:', token.value);
      if (token?.value) {
        syncFcmToken(token.value)
      }
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Notification reçue :', notification);
      addNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data ?? {}
      })
    });

    PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('Notification tap :', notification);
    });

    // ⚡ 2️⃣ Demande la permission et enregistre
    PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        PushNotifications.register();
      } else {
        console.log('Permission refusée pour notifications');
      }
    });
  }
});
