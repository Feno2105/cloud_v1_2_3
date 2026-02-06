import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { IonicVue } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

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

router.isReady().then(() => {
  app.mount('#app');

  if (Capacitor.isNativePlatform()) {
    // ------------------- PUSH NOTIFICATIONS -------------------
    
    // ⚡ 1️⃣ Ajoute tous les listeners avant register
    PushNotifications.addListener('registration', token => {
      console.log('TOKEN FCM:', token.value);
      // Abonne au topic global
      // Exemple : backend ou directement via Firebase
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Notification reçue :', notification);
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
