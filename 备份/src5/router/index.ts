import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import TemplateEditor from '@/pages/TemplateEditor.vue'
import TemplatesList from '@/pages/TemplatesList.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/templates' },
  { path: '/templates', component: TemplatesList },
  { path: '/editor', component: TemplateEditor }, // ?id=xxx
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
