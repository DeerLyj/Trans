<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EditorPane from '@/components/EditorPane.vue'
import ProtoPreview from '@/components/ProtoPreview.vue'
import { yamlToProto } from '@/utils/yamlToProto.js'
import { getTemplate, upsertTemplate, deleteTemplate, createBlankTemplate } from '@/utils/templateStore.js'

const route = useRoute()
const router = useRouter()

// 当前模板 id（存在则为编辑）
const currentId = ref(null)

// 表单数据
const name = ref('新模板')
const desc = ref('模板描述')
const yamlText = ref(`server:
  name: "user.service"
  version: "1.0"
  http:
    addr: 0.0.0.0:8001
    timeout: 1s
`)
const protoText = ref('')

// YAML → Proto 联动（无自动保存）
watch(yamlText, v => {
  protoText.value = yamlToProto(v || '', 'SomeMessage')
}, { immediate: true })

// 从 URL ?id= 加载
onMounted(() => {
  const id = route.query.id
  if (id && typeof id === 'string') {
    const tpl = getTemplate(id)
    if (tpl) {
      currentId.value = id
      name.value = tpl.name || '新模板'
      desc.value = tpl.desc || ''
      yamlText.value = tpl.yaml || ''
    }
  }
})

// 左侧格式化
const editorRef = ref(null)
function formatLeft() { editorRef.value?.format?.() }

// 顶部按钮
function goList() { router.push('/templates') }
function newTemplate() {
  const id = createBlankTemplate()
  router.push({ path: '/editor', query: { id } })
}

// 仅在“保存”时写入
function save() {
  const id = upsertTemplate({
    id: currentId.value || undefined,
    name: name.value,
    desc: desc.value,
    yaml: yamlText.value
  })
  currentId.value = id
  alert('已保存到模板列表')
}

// 重置/删除
function resetAll() {
  if (!confirm('确定重置当前编辑内容？')) return
  name.value = '新模板'
  desc.value = ''
  yamlText.value = ''
}
function removeCurrent() {
  if (!currentId.value) {
    if (!confirm('当前未保存为模板，直接清空编辑内容？')) return
    resetAll(); return
  }
  if (!confirm('确定删除该模板？此操作不可恢复')) return
  deleteTemplate(currentId.value)
  alert('已删除')
  router.push('/templates')
}
</script>

<template>
  <div class="page">
    <!-- 顶部大标题 -->
    <header class="hero">
      <div class="brand">
        <span class="logo">🎯</span>
        <div class="title">YAML 模板编辑器 · Proto 预览</div>
      </div>
      <div class="right-actions">
        <button class="btn" @click="goList">模板列表</button>
        <button class="btn primary" @click="newTemplate">新建模板</button>
      </div>
    </header>

    <!-- ✅ 将“编辑模板”和“名称”两行框在一起 -->
    <section class="meta-card">
      <!-- 第1行：编辑模板 + 操作按钮 -->
      <div class="meta-top">
        <span class="chip green">✖ 编辑模板</span>
        <div class="top-ops">
          <button class="btn" @click="resetAll">重置</button>
          <button class="btn danger" @click="removeCurrent">删除</button>
          <button class="btn primary" @click="save">保存</button>
        </div>
      </div>

      <!-- 第2行：名称/描述输入（与上面在同一卡片内） -->
      <div class="meta-form">
        <label>名称</label>
        <input v-model="name" placeholder="输入模板名称" />
        <label>描述</label>
        <input v-model="desc" placeholder="输入模板描述" />
        <div class="spacer"></div>
        <span v-if="currentId" class="meta-id">ID: {{ currentId }}</span>
      </div>
    </section>

    <!-- 主体双栏 -->
    <main class="main">
      <!-- 左列 -->
      <section class="left">
        <div class="panel-title">
          <span>编辑区</span>
          <div class="ops">
            <button class="btn" @click="formatLeft">格式化</button>
          </div>
        </div>
        <EditorPane ref="editorRef" v-model:yaml="yamlText" class="fill" />
      </section>

      <!-- 右列 -->
      <section class="right">
        <div class="panel-title">
          <span>Protobuf 代码预览（自动从 YAML 推断）</span>
          <div class="ops">
            <button class="btn" @click="navigator.clipboard.writeText(protoText)">复制</button>
            <a
              class="btn"
              :href="'data:text/plain;charset=utf-8,' + encodeURIComponent(protoText)"
              download="schema.proto"
            >下载 .proto</a>
          </div>
        </div>
        <ProtoPreview :code="protoText" class="fill" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.page{ padding:16px 20px; max-width:1600px; margin:0 auto; color:#e6edf3; }

/* 顶部大标题 */
.hero{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 16px;
  border:1px solid var(--ui-border); border-radius:14px;
  background: rgba(255,255,255,.03);
}
.brand{ display:flex; align-items:center; gap:12px; }
.logo{ font-size:22px; }
.title{ font-size:22px; font-weight:900; letter-spacing:.5px; }

.right-actions{ display:flex; gap:10px; }
.btn{
  background:#0f172a; color:#e5e7eb; border:1px solid #334155;
  border-radius:10px; padding:8px 12px; text-decoration:none; cursor:pointer;
}
.btn.primary{ background:#2563eb; border-color:#2563eb; color:#fff; }
.btn.danger{ background:#991b1b; border-color:#991b1b; color:#fff; }

/* ✅ 合并卡片 */
.meta-card{
  margin-top:15px;
  border:1px solid var(--ui-border); border-radius:14px;
  background: rgba(31,41,55,.65);
  overflow:hidden;
}
.meta-top{
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 12px; border-bottom:1px solid var(--ui-border);
}
.chip{
  display:inline-block; padding:4px 8px; border-radius:999px; font-weight:600;
  background:#0f172a; border:1px solid #334155;
}
.chip.green{ background:#0f172a; border-color:#166534; color:#a7f3d0; }
.top-ops{ display:flex; gap:10px; }

.meta-form{
  display:flex; gap:12px; align-items:center;
  padding:10px 12px;
  background: rgba(255,255,255,.02);
}
.meta-form input{
  width: 320px; background:#0f172a; color:#e6edf3;
  border:1px solid #334155; border-radius:8px; padding:8px 10px;
}
.meta-id{ opacity:.7; font-size:12px; }
.spacer{ flex:1 }

/* 主体布局 */
.main{
  margin-top:15px;
  display:grid; gap:14px; grid-template-columns: 1fr 1fr;
  height: calc(100vh - 250px);
}
.left, .right{ display:flex; flex-direction:column; min-height:0 }
.panel-title{
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 12px; background: rgba(31,41,55,.8);
  border:1px solid var(--ui-border); border-radius:12px 12px 0 0;
}
.ops{ display:flex; gap:8px }
.fill{
  flex:1; border:1px solid var(--ui-border); border-top:none; border-radius:0 0 12px 12px;
  overflow:hidden; box-shadow: 0 10px 25px rgba(0,0,0,.25);
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
  backdrop-filter: blur(6px);
}

/* 主题变量 */
:root, :host{ --ui-border: #33415566; }
</style>
