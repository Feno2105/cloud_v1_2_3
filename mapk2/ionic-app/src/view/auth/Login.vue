<template>
  <ion-page class="auth-page">
    <ion-content :fullscreen="true" class="auth-content">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-orb"></div>
          <h1>Connexion</h1>
          <p>Accès utilisateur mobile</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <ion-item lines="none" class="auth-item">
            <ion-input
              v-model="email"
              label="Email"
              label-placement="stacked"
              type="email"
              required
              :disabled="loading"
            />
          </ion-item>

          <ion-item lines="none" class="auth-item">
            <ion-input
              v-model="password"
              label="Mot de passe"
              label-placement="stacked"
              type="password"
              required
              :disabled="loading"
            />
          </ion-item>

          <ion-text v-if="error" color="danger" class="auth-error">{{ error }}</ion-text>

          <ion-button type="submit" expand="block" class="auth-button" :disabled="loading">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { fetchUserProfile, isMobileAuthorized, logoutMobile } from '../../services/mobileAuth'
import {
  IonPage,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonText
} from '@ionic/vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!navigator.onLine) {
    error.value = 'Connexion internet requise.'
    return
  }

  error.value = ''
  loading.value = true
  try {
    const credential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const profile = await fetchUserProfile(credential.user)

    if (!isMobileAuthorized(profile)) {
      await logoutMobile()
      error.value = 'Accès refusé pour ce compte.'
      return
    }

    await router.replace('/home')
  } catch (err: any) {
    error.value = err?.message || 'Erreur de connexion.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  --background: radial-gradient(circle at top, #0f172a, #020617 65%);
}

.auth-content {
  --background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.5);
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #f8fafc;
}

.auth-orb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin: 0 auto 0.75rem;
  background: #38bdf8;
  box-shadow: 0 0 12px #38bdf8;
}

.auth-header p {
  color: #94a3b8;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-item {
  --background: rgba(15, 23, 42, 0.8);
  --border-radius: 12px;
  --border-width: 1px;
  --border-color: rgba(148, 163, 184, 0.2);
  --color: #e2e8f0;
  margin-bottom: 0.5rem;
}

.auth-error {
  text-align: center;
  font-size: 0.9rem;
}

.auth-button {
  --background: linear-gradient(120deg, #38bdf8, #8b5cf6);
  --color: #0b1120;
  font-weight: 700;
}
</style>
