<template>
  <ion-app>
    <!-- MENU -->
    <ion-menu content-id="main-content">
      <ion-header>
        <ion-toolbar class="menu-toolbar">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>

          <ion-menu-toggle auto-hide="true">
            <ion-item router-link="/home">
              <ion-icon name="home-outline" slot="start" />
              <ion-label>Accueil</ion-label>
            </ion-item>
          </ion-menu-toggle>

          <ion-menu-toggle auto-hide="true">
            <ion-item button @click="logout">
              <ion-icon name="log-out-outline" slot="start" />
              <ion-label>Déconnexion</ion-label>
            </ion-item>
          </ion-menu-toggle>

        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- CONTENU PRINCIPAL -->
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup lang="ts">
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "vue-router";
import {
  IonApp,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuToggle,
  IonRouterOutlet
} from '@ionic/vue';


const router = useRouter();

const logout = async () => {
  await signOut(auth);
  router.replace("/login");
};
</script>

<style scoped>
.menu-toolbar {
  --background: rgba(15, 23, 42, 0.95);
  --color: #f8fafc;
}

ion-content {
  --background: rgba(15, 23, 42, 0.95);
  color: #e2e8f0;
}

ion-item {
  --background: transparent;
  --color: #e2e8f0;
}
</style>


