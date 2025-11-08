<template>
  <div class="list-page">
    <!-- 顶部工具条 -->
    <div class="toolbar">
      <h2 class="title">模板列表</h2>
      <div class="tools">
        <input
          v-model="searchInput"
          type="text"
          class="search"
          placeholder="搜索名称/描述..."
        />
        <button class="btn primary" @click="onCreate">新建模板</button>
      </div>
    </div>

    <!-- 表格卡片 -->
    <section class="card table-wrap">
      <header class="thead">
        <div class="th name">名称</div>
        <div class="th desc">描述</div>
        <div class="th time">创建时间</div>
        <div class="th time">修改时间</div>
        <div class="th ops">操作</div>
      </header>

      <div v-if="rows.length" class="tbody">
        <article
          v-for="t in rows"
          :key="t.id"
          class="tr"
          :data-hover="true"
        >
          <div class="td name">
            <span v-html="hl(t.name)"></span>
          </div>
          <div class="td desc">
            <span v-html="hl(t.desc || '—')"></span>
          </div>
          <div class="td time">{{ fmt(t.createdAt) }}</div>
          <div class="td time">{{ fmt(t.updatedAt) }}</div>
          <div class="td ops">
            <button class="btn ghost" @click="onEdit(t.id)">编辑</button>
            <button class="btn danger" @click="onDelete(t.id)">删除</button>
          </div>
        </article>
      </div>

      <div v-else class="empty">
        暂无模板，点击右上角「新建模板」开始
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  listTemplates,
  deleteTemplate,
  createBlankTemplate,
  formatTime,
  type TemplateItem,
} from '@/utils/templateStore'

const router = useRouter()
const all = ref<TemplateItem[]>([])
const searchInput = ref('')     // 输入框原值
const keyword = ref('')         // 防抖后的关键字

// 首次加载
function reload() { all.value = listTemplates() }
onMounted(reload)

// 300ms 防抖
let timer: number | undefined
watch(searchInput, (v) => {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (keyword.value = v.trim().toLowerCase()), 300)
})

// 过滤
const rows = computed(() => {
  if (!keyword.value) return all.value
  return all.value.filter(t =>
    (t.name || '').toLowerCase().includes(keyword.value) ||
    (t.desc || '').toLowerCase().includes(keyword.value),
  )
})

// 安全高亮
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
function hl(s: string) {
  if (!s) return ''
  const safe = escapeHtml(s)
  if (!keyword.value) return safe
  const re = new RegExp(`(${keyword.value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'ig')
  return safe.replace(re, '<mark class="hit">$1</mark>')
}

// 事件
function onCreate() {
  const id = createBlankTemplate()
  router.push({ path: '/editor', query: { id } })
}
function onEdit(id: string) {
  router.push({ path: '/editor', query: { id } })
}
function onDelete(id: string) {
  if (confirm('确认删除该模板？')) {
    deleteTemplate(id)
    reload()
  }
}
function fmt(iso: string | null) { return formatTime(iso ?? undefined) }
</script>

<style scoped>
/* 页面布局 */
.list-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 顶部工具条 */
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}
.title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}
.tools {
  display: flex;
  gap: 12px;
  align-items: center;
}
.search {
  width: 420px; max-width: 48vw;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #374151;
  background: #0b1220; color: #e5e7eb;
  outline: none;
}
.search::placeholder { color:#94a3b8; opacity:.6; }

/* 表格卡片 */
.table-wrap {
  border: 1px solid #1f2937;
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(0,0,0,.35);
  overflow: hidden;
  background: #0f172a;
}

/* 粘性表头 */
.thead {
  position: sticky; top: 64px; z-index: 5; /* 64 与你的顶部导航高度匹配 */
  display: grid;
  grid-template-columns: 2fr 3fr 1.6fr 1.6fr 1.2fr;
  padding: 14px 18px;
  background: #172033;
  color: #e5e7eb;
  font-weight: 700;
  border-bottom: 1px solid #1f2937;
}
.th { white-space: nowrap; }
.name { text-align: left; }
.desc { text-align: left; }
.time, .ops { text-align: left; }

/* 数据行 */
.tbody { display: block; }
.tr {
  display: grid;
  grid-template-columns: 2fr 3fr 1.6fr 1.6fr 1.2fr;
  align-items: center;
  padding: 14px 18px;
  column-gap: 12px;
  border-bottom: 1px solid #121a2b;
  transition: background .15s ease, transform .08s ease;
  background: #0f172a;
}
.tbody .tr:nth-child(odd) { background: #0e1526; } /* 斑马纹 */
.tr:hover {
  background: #101a30;
  transform: translateY(-1px);
}
.td {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.td.name { font-weight: 600; }
.td.desc { opacity: .9; }
.td.time { font-variant-numeric: tabular-nums; opacity: .9; }

/* 命中高亮 */
.hit {
  background: #fde68a;
  color: #111827;
  padding: 0 2px;
  border-radius: 3px;
}

/* 操作按钮 */
.ops { display: flex; gap: 10px; justify-content: flex-start; }
.btn {
  display:inline-flex; align-items:center; gap:6px;
  padding:8px 12px; border-radius: 10px; border:1px solid #374151;
  background:#111827; color:#e5e7eb; font-size:13px; cursor:pointer;
}
.btn:hover { background:#1f2937; }
.btn.primary { background:#2563eb; border-color:#1d4ed8; }
.btn.primary:hover { filter:brightness(1.05); }
.btn.ghost { background:#172033; }
.btn.ghost:hover { background:#1f2a45; }
.btn.danger { background:#b91c1c; border-color:#7f1d1d; }
.btn.danger:hover { background:#dc2626; }

/* 空状态 */
.empty {
  padding: 28px;
  text-align: center;
  opacity: .8;
}

/* 响应式：窄屏改为“卡片行” */
@media (max-width: 920px) {
  .thead { display: none; }
  .tr {
    grid-template-columns: 1fr;
    row-gap: 6px;
  }
  .td { white-space: normal; }
  .ops { justify-content: flex-end; }
}
</style>
