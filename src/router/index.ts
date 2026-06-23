import { createRouter, createWebHistory } from 'vue-router'
import Home         from '../pages/Home.vue'
import Detail       from '../pages/Detail.vue'
import Create       from '../pages/Create.vue'
import Edit         from '../pages/Edit.vue'
import GpxLibrary   from '../pages/GpxLibrary.vue'
import GearLibrary  from '../pages/GearLibrary.vue'
import Profile      from '../pages/Profile.vue'
import AuthCallback from '../pages/AuthCallback.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',              component: Home },
    { path: '/detail/:id',   component: Detail },
    { path: '/create',       component: Create },
    { path: '/edit/:id',     component: Edit },
    { path: '/gpx-library',  component: GpxLibrary },
    { path: '/gear-library', component: GearLibrary },
    { path: '/profile',      component: Profile },
    { path: '/auth/callback', component: AuthCallback },
  ],
})

router.beforeEach((to) => {
  const protectedPaths = ['/create', '/gpx-library', '/gear-library', '/profile']
  if (protectedPaths.includes(to.path) || to.path.startsWith('/edit/')) {
    const auth = useAuthStore()
    if (!auth.user) return '/'
  }
})

export default router
