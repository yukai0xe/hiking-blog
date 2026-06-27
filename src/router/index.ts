import { createRouter, createWebHistory } from 'vue-router'
import Home           from '../pages/Home.vue'
import PostDetail     from '../pages/PostDetail.vue'
import PostCreate     from '../pages/PostCreate.vue'
import PostEdit       from '../pages/PostEdit.vue'
import GpxLibrary     from '../pages/GpxLibrary.vue'
import GearLibrary    from '../pages/GearLibrary.vue'
import GearEditPage   from '../pages/GearEditPage.vue'
import GearDetailPage from '../pages/GearDetailPage.vue'
import Profile        from '../pages/Profile.vue'
import Notes          from '../pages/Notes.vue'
import AuthCallback   from '../pages/AuthCallback.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',              component: Home },
    { path: '/detail/:id',   component: PostDetail },
    { path: '/create',       component: PostCreate },
    { path: '/edit/:id',     component: PostEdit },
    { path: '/gpx-library',  component: GpxLibrary },
    { path: '/gear-library', component: GearLibrary },
    { path: '/gear-library/edit/:id', component: GearEditPage },
    { path: '/gear-library/:id',      component: GearDetailPage },
    { path: '/profile',      component: Profile },
    { path: '/notes',        component: Notes },
    { path: '/auth/callback', component: AuthCallback },
  ],
})

router.beforeEach((to) => {
  const protectedPaths = ['/create', '/gpx-library', '/gear-library', '/profile', '/notes']
  if (protectedPaths.includes(to.path) || to.path.startsWith('/edit/') || to.path.startsWith('/gear-library/')) {
    const auth = useAuthStore()
    if (!auth.user) return '/'
  }
})

export default router
