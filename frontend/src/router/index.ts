import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import PetaniDashboardView from '../views/PetaniDashboardView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import InputLahanView from '../views/InputLahanView.vue'
import RiwayatPetaniView from '../views/RiwayatPetaniView.vue'
import ProfilPetaniView from '../views/ProfilPetaniView.vue'
import AdminLahanView from '../views/AdminLahanView.vue'
import AdminLogView from '../views/AdminLogView.vue'
import AdminPengaturanView from '../views/AdminPengaturanView.vue'

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
      path: '/input-lahan',
      name: 'input-lahan',
      component: InputLahanView
    },
    {
      path: '/riwayat',
      name: 'riwayat',
      component: RiwayatPetaniView
    },
    {
      path: '/profil',
      name: 'profil',
      component: ProfilPetaniView
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView
    },
    {
      path: '/admin/lahan',
      name: 'admin-lahan',
      component: AdminLahanView
    },
    {
      path: '/admin/log',
      name: 'admin-log',
      component: AdminLogView
    },
    {
      path: '/admin/pengaturan',
      name: 'admin-pengaturan',
      component: AdminPengaturanView
    }
  ]
})

export default router
