<template>
  <div class="page">
    <!-- 表单卡片 -->
    <section class="card form-card">
      <header class="card-head">
        <div class="head-left">
          <span class="dot">▰</span>
          <span class="title">编辑模板</span>
        </div>
        <div class="head-right">
          <button class="btn ghost" @click="goList">模板列表</button>
          <button class="btn warn"  @click="onReset">重置</button>
          <button class="btn danger" v-if="editingId" @click="onDelete">删除</button>
          <button class="btn primary" @click="onSave">保存</button>
        </div>
      </header>

      <div class="form">
        <div class="row">
          <label class="lab">名称</label>
          <input class="input" v-model="name" placeholder="如：user.service 配置" />
          <label class="lab">描述</label>
          <input class="input" v-model="desc" placeholder="一句话说明（可选）" />
          <div class="id-box" v-if="editingId">
            <span>ID:</span><em>{{ editingId }}</em>
          </div>
        </div>
      </div>
    </section>

    <!-- 左右两栏：把计算后的高度传给面板 -->
    <EditorPane
      v-model="yaml"
      :proto-root-name="protoRootName"
      :pane-height="paneHeight"
      @format="formatYaml"
    />

    <!-- 高级设置 -->
    <details class="card adv">
      <summary>高级 - Proto 根消息名</summary>
      <div class="adv-body">
        <input class="input" v-model="protoRootName" placeholder="SomeMessage" />
      </div>
    </details>

    <!-- 视口尺寸提示（可删） -->
    <div class="vp-badge">{{ vpW }} × {{ vpH }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EditorPane from '@/components/EditorPane.vue'
import { getTemplate, upsertTemplate, deleteTemplate as removeTemplate } from '@/utils/templateStore'
import { yamlToObject, objectToYaml } from '@/utils/yamlTools'

const route = useRoute()
const router = useRouter()

const editingId = ref<string|null>(null)
const name = ref('新模板3')
const desc = ref('模板描述1231')
const yaml = ref<string>(`server:
  name: "user.service"
  version: "1.0"
  http:
    addr: 0.0.0.0:8001
    timeout: 1s
`)
const protoRootName = ref('SomeMessage')

/** ====== 关键：计算编辑/预览面板高度（窗口自适应，面板内滚动） ====== */
const paneHeight = ref<number>(480)
const vpW = ref<number>(window.innerWidth)
const vpH = ref<number>(window.innerHeight)
/** 预估顶部（站点Header）+ 本页表单卡片 + 上下间距的总高度，按你的样式微调 */
const RESERVED = 250 // px：可根据你实际头部高度&表单高度再微调

function calcHeight() {
  vpW.value = window.innerWidth
  vpH.value = window.innerHeight
  const h = Math.max(360, window.innerHeight - RESERVED) // 最小 360
  paneHeight.value = h
}
onMounted(() => {
  calcHeight()
  window.addEventListener('resize', calcHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', calcHeight)
})
/** =============================================================== */

onMounted(() => {
  const id = (route.query.id as string) || ''
  if (!id) return
  const t = getTemplate(id)
  if (t) {
    editingId.value = t.id
    name.value = t.name || ''
    desc.value = t.desc || ''
    yaml.value = t.yaml || yaml.value
  }
})

function onSave() {
  const id = upsertTemplate({
    id: editingId.value ?? undefined,
    name: name.value,
    desc: desc.value,
    yaml: yaml.value,
  })
  editingId.value = id
  alert('已保存')
}
function onReset() { if (confirm('确认清空当前编辑内容？')) yaml.value = '' }
function onDelete() {
  if (!editingId.value) return
  if (confirm('确认删除该模板？')) { removeTemplate(editingId.value); router.push('/templates') }
}
function goList() { router.push('/templates') }

function formatYaml() {
  const { data, error } = yamlToObject(yaml.value || '')
  if (error || !data || typeof data !== 'object') { alert('当前 YAML 不合法，无法格式化'); return }
  const { yaml: out } = objectToYaml(data as Record<string, unknown>)
  yaml.value = out
}
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:14px}

/* 表单卡片（保留你现有样式） */
.card{background:#0f172a;border:1px solid #1f2937;border-radius:14px;box-shadow:0 10px 24px rgba(0,0,0,.28);overflow:hidden}
.card-head{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid #1f2937;background:linear-gradient(180deg,#0f172a,#0f172acc)}
.head-left{display:flex;align-items:center;gap:10px}
.dot{color:#60a5fa;opacity:.9}
.title{font-weight:800;font-size:14px}
.head-right{display:flex;gap:8px}
.form{padding:12px 14px}
.row{display:grid;grid-template-columns:auto 1fr auto 1fr auto;gap:10px;align-items:center}
.lab{font-size:12px;opacity:.78;width:44px}
.input{background:#0b1220;color:#e5e7eb;border:1px solid #1f2937;border-radius:10px;padding:10px 12px;width:100%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)}
.id-box{justify-self:end;display:flex;gap:6px;align-items:center;font-size:12px;opacity:.65;padding:6px 10px;background:#0b1220;border:1px dashed #2a3347;border-radius:8px}
.id-box em{font-style:normal;opacity:.9}

/* 高级设置 */
.adv{margin-top:8px}
.adv summary{cursor:pointer;padding:12px 14px;border-bottom:1px solid #1f2937}
.adv-body{padding:12px 14px;max-width:360px}

/* 按钮 */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;border:1px solid #374151;background:#111827;color:#e5e7eb;font-size:13px;cursor:pointer}
.btn:hover{background:#1f2937}
.btn.primary{background:#2563eb;border-color:#1d4ed8}.btn.primary:hover{filter:brightness(1.05)}
.btn.warn{border-color:#7c3aed}.btn.warn:hover{background:#7c3aed}
.btn.danger{border-color:#7f1d1d}.btn.danger:hover{background:#dc2626}
.btn.ghost{background:transparent}

/* 视口尺寸徽标（调试用，可删） */
.vp-badge{
  position: fixed; right: 10px; bottom: 10px; z-index: 20;
  background: #0b1220; border: 1px solid #1f2937; color:#94a3b8;
  border-radius: 8px; padding: 4px 8px; font-size: 12px; opacity: .75;
}
</style>
