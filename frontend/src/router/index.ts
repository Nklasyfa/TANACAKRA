import { createRouter, createWebHistory } from 'vue-router'
import { getStoredSession, resolveSession } from '../services/session'
import LandingView from '../views/public/LandingView.vue'
import LoginView from '../views/public/LoginView.vue'
import PetaniDashboardView from '../views/petani/PetaniDashboardView.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import InputLahanView from '../views/petani/InputLahanView.vue'
import RiwayatPetaniView from '../views/petani/RiwayatPetaniView.vue'
import ProfilPetaniView from '../views/petani/ProfilPetaniView.vue'
import AdminLahanView from '../views/admin/AdminLahanView.vue'
import AdminLogView from '../views/admin/AdminLogView.vue'
import AdminPengaturanView from '../views/admin/AdminPengaturanView.vue'
import KabarTaniView from '../views/petani/KabarTaniView.vue'
import WartaDetailView from '../views/petani/WartaDetailView.vue'
import PrediksiPasarView from '../views/petani/PrediksiPasarView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Array<'PETANI' | 'ADMIN' | 'PENYULUH'>
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/petani',
      name: 'petani-dashboard',
      component: PetaniDashboardView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/input-lahan',
      name: 'input-lahan',
      component: InputLahanView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/riwayat',
      name: 'riwayat',
      component: RiwayatPetaniView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/profil',
      name: 'profil',
      component: ProfilPetaniView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/kabar-tani',
      name: 'kabar-tani',
      component: KabarTaniView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/admin/kabar-tani',
      redirect: '/kabar-tani'
    },
    {
      path: '/warta/:id',
      name: 'warta-detail',
      component: WartaDetailView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/prediksi-pasar',
      name: 'prediksi-pasar',
      component: PrediksiPasarView,
      meta: { requiresAuth: true, roles: ['PETANI', 'ADMIN', 'PENYULUH'] }
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'PENYULUH'] }
    },
    {
      path: '/admin/lahan',
      name: 'admin-lahan',
      component: AdminLahanView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'PENYULUH'] }
    },
    {
      path: '/admin/log',
      name: 'admin-log',
      component: AdminLogView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'PENYULUH'] }
    },
    {
      path: '/admin/pengaturan',
      name: 'admin-pengaturan',
      component: AdminPengaturanView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'PENYULUH'] }
    },
    {
      path: '/tentang-kami',
      redirect: '/#tentang'
    }
  ]
})

router.beforeEach(async (to) => {
  let { token, role } = getStoredSession()

  if (!token) {
    const bridged = await resolveSession()
    if (bridged) {
      token = bridged.token
      role = bridged.role
    }
  }

  if (to.name === 'login') {
    if (token) {
      return (role === 'ADMIN' || role === 'PENYULUH') ? '/admin' : '/petani'
    }
    return true
  }

  if (to.meta.requiresAuth) {
    if (!token) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    const allowedRoles = (to.meta.roles as Array<'PETANI' | 'ADMIN' | 'PENYULUH'> | undefined) ?? []
    if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
      return (role === 'ADMIN' || role === 'PENYULUH') ? '/admin' : '/petani'
    }
  }

  return true
})

export default router