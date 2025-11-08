<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { listTemplates, deleteTemplate, formatTime } from '@/utils/templateStore.js'

const router = useRouter()

const q = ref('')
const reloadFlag = ref(0)

const all = computed(() => listTemplates())
const filtered = computed(() => {
  const kw = q.value.trim().toLowerCase()
  if (!kw) return all.value
  return all.value.filter(t =>
    (t.name || '').toLowerCase().includes(kw) ||
    (t.desc || '').toLowerCase().includes(kw)
  )
})

function openTemplate(id) {
  router.push({ path: '/editor', query: { id } })
}
function remove(id) {
  if (!confirm('确定删除该模板？此操作不可恢复')) return
  deleteTemplate(id)
  reloadFlag.value++
}
</script>

<template>
  <div class="page">
    <div class="head">
      <div class="title">模板列表</div>
      <div class="actions">
        <input v-model="q" placeholder="搜索名称/描述..." />
        <router-link class="btn primary" to="/editor">新建模板</router-link>
      </div>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th style="width:26%">名称</th>
            <th>描述</th>
            <th style="width:18%">创建时间</th>
            <th style="width:18%">修改时间</th>
            <th style="width:120px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filtered" :key="t.id" @click="openTemplate(t.id)">
            <td class="name">{{ t.name }}</td>
            <td class="desc">{{ t.desc }}</td>
            <td>{{ formatTime(t.createdAt) }}</td>
            <td>{{ t.updatedAt ? formatTime(t.updatedAt) : '-' }}</td>
            <td class="ops" @click.stop>
              <button class="btn" @click="openTemplate(t.id)">编辑</button>
              <button class="btn danger" @click="remove(t.id)">删除</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="5" class="empty">没有匹配的模板</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page{ padding:20px; max-width:1200px; margin:0 auto; color:#e6edf3; }
.head{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.title{ font-size:20px; font-weight:800; }
.actions{ display:flex; gap:10px; align-items:center; }
.actions input{
  width: 260px; background:#0f172a; color:#e6edf3;
  border:1px solid #334155; border-radius:8px; padding:8px 10px;
}
.card{
  border:1px solid #33415566; border-radius:12px; overflow:hidden;
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
  box-shadow: 0 10px 25px rgba(0,0,0,.25);
}
table{ width:100%; border-collapse:collapse; }
thead th{
  text-align:left; background:rgba(31,41,55,.85); border-bottom:1px solid #33415566; padding:10px 12px;
}
tbody td{ padding:10px 12px; border-bottom:1px solid #33415533; }
tbody tr{ cursor:pointer; }
tbody tr:hover{ background:#0f172a; }
.name{ font-weight:600; }
.desc{ opacity:.9; }
.ops{ display:flex; gap:8px; }
.btn{
  background:#0f172a; color:#e5e7eb; border:1px solid #334155; border-radius:8px; padding:6px 10px; text-decoration:none;
}
.btn.primary{ background:#2563eb; border-color:#2563eb; color:white; }
.btn.danger{ background:#991b1b; border-color:#991b1b; color:white; }
.empty{ text-align:center; padding:24px 0; color:#94a3b8; }
</style>
