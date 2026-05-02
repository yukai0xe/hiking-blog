import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Detail from '../pages/Detail.vue'
import Create from '../pages/Create.vue'
import Edit from '../pages/Edit.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/detail/:id', component: Detail },
    { path: '/create', component: Create },
    { path: '/edit/:id', component: Edit },
  ],
})

export default router
