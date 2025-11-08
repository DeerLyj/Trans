/* ====== 页面导航系统（路由） ====== */

import { createRouter, createWebHashHistory } from 'vue-router'
import TemplateEditor from '@/pages/TemplateEditor.vue'  // 编辑页面
import TemplatesList from '@/pages/TemplatesList.vue'  // 列表页面

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/templates' },
    { path: '/templates', component: TemplatesList },
    { path: '/editor', component: TemplateEditor }, // 可带 ?id=xxx
  ],
})

export default router
