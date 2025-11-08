import { createRouter, createWebHashHistory } from 'vue-router'
import TemplateEditor from '@/pages/TemplateEditor.vue'
import TemplatesList from '@/pages/TemplatesList.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/templates' },
    { path: '/templates', component: TemplatesList },
    { path: '/editor', component: TemplateEditor }, // 可带 ?id=xxx
  ],
})

export default router
