import { createRouter, createWebHistory } from 'vue-router'
import Home         from '../pages/Home.vue'
import Detail       from '../pages/Detail.vue'
import Create       from '../pages/Create.vue'
import Edit         from '../pages/Edit.vue'
import GpxLibrary   from '../pages/GpxLibrary.vue'
import GearLibrary  from '../pages/GearLibrary.vue'
import GearEditPage   from '../pages/GearEditPage.vue'
import GearDetailPage from '../pages/GearDetailPage.vue'
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
    { path: '/gear-library/edit/:id', component: GearEditPage },
    { path: '/gear-library/:id',      component: GearDetailPage },
    { path: '/profile',      component: Profile },
    { path: '/auth/callback', component: AuthCallback },
  ],
})

router.beforeEach((to) => {
  const protectedPaths = ['/create', '/gpx-library', '/gear-library', '/profile']
  if (protectedPaths.includes(to.path) || to.path.startsWith('/edit/') || to.path.startsWith('/gear-library/')) {
    const auth = useAuthStore()
    if (!auth.user) return '/'
  }
})

export default router
