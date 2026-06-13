import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Detail from '../pages/Detail.vue'
import Create from '../pages/Create.vue'
import Edit from '../pages/Edit.vue'
import GpxLibrary from '../pages/GpxLibrary.vue'
import GearLibrary from '../pages/GearLibrary.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/detail/:id', component: Detail },
    { path: '/create', component: Create },
    { path: '/edit/:id', component: Edit },
    { path: '/gpx-library', component: GpxLibrary },
    { path: '/gear-library', component: GearLibrary },
  ],
})

export default router
