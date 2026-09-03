import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import PetaniDashboardView from '../views/PetaniDashboardView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import InputLahanView from '../views/InputLahanView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/petani',
      name: 'petani-dashboard',
      component: PetaniDashboardView
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView
    },
    {
      path: '/input-lahan',
      name: 'input-lahan',
      component: InputLahanView
    }
  ]
})

export default router
