import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '../view/auth/Login.vue';
import Home from '../view/Home.vue';
import { getCurrentUser, fetchUserProfile, getCachedProfile, isMobileAuthorized } from '../services/mobileAuth';


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/home',
    component: Home
  }

]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

router.beforeEach(async (to) => {
  if (to.path === '/login') return true

  const user = await getCurrentUser()
  if (!user) return '/login'

  const profile = (await fetchUserProfile(user)) ?? getCachedProfile()
  if (!isMobileAuthorized(profile)) return '/login'

  return true
})
