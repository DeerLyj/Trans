<template>
  <div class="designer">
    <!-- 工具条 -->
    <div class="toolbar">
      <button class="btn primary" @click="addField">新增字段</button>
      <span class="hint">（此处只维护字段；手动编辑 YAML 会自动同步到此列表；修改字段将把生成的 YAML 写回上方编辑区）</span>
    </div>

    <!-- 字段列表 -->
    <section class="panel">
      <header class="panel-head"><div class="title">字段列表</div></header>

      <div class="panel-body list-body">
        <table class="table">
          <thead>
            <tr>
              <th style="width:240px">名称</th>
              <th style="width:160px">父级路径</th>
              <th style="width:120px">类型</th>
              <th style="width:90px">必填</th>
              <th style="width:320px">值（统一为输入框）</th>
              <th style="width:240px">描述（可选）</th>
              <th style="width:230px">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(f, i) in fields" :key="f.id">
              <!-- 名称 -->
              <td>
                <input
                  class="inp"
                  v-model="f.name"
                  :class="{ invalid: f.name && !validName(f.name) }"
                  placeholder="如：addr / timeout"
                />
                <div v-if="f.name && !validName(f.name)" class="tip">需以字母/下划线开头，只含字母数字下划线</div>
              </td>

              <!-- 父级路径 -->
              <td>
                <input class="inp" v-model="f.parentPath" placeholder="如：server.http（留空=顶层）" />
              </td>

              <!-- 类型 -->
              <td>
                <select class="sel" v-model="f.type">
                  <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </td>

              <!-- 必填 -->
              <td class="center">
                <label class="switch">
                  <input type="checkbox" v-model="f.required" />
                  <span></span>
                </label>
              </td>

              <!-- 值：统一输入框 -->
              <td>
                <input
                  class="inp"
                  v-model="f.valueText"
                  :placeholder="valuePlaceholder(f.type)"
                />
              </td>

              <!-- 描述 -->
              <td>
                <input class="inp" v-model="f.description" placeholder="字段说明（可选）" />
              </td>

              <!-- 操作 -->
              <td class="ops">
                <button class="btn ghost" @click="dup(i)">复制</button>
                <button class="btn ghost" @click="move(i,-1)" :disabled="i===0">上移</button>
                <button class="btn ghost" @click="move(i,1)" :disabled="i===fields.length-1">下移</button>
                <button class="btn danger" @click="del(i)">删除</button>
              </td>
            </tr>

            <tr v-if="!fields.length">
              <td colspan="7" class="empty">暂无字段，点击上方“新增字段”开始；或先在编辑区粘贴 YAML</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { objectToYaml, yamlToObject } from '@/utils/yamlTools'

/** ========= 类型 ========= */
type FieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object'
interface FieldRow {
  id: string
  name: string
  parentPath?: string
  type: FieldType
  required: boolean
  description?: string
  /** 统一文本值（无论什么类型都走这个字段） */
  valueText: string
}

const props = withDefaults(defineProps<{ sourceYaml?: string }>(), { sourceYaml: '' })
const emit = defineEmits<{ (e: 'update-yaml', yaml: string): void }>()
const TYPES: FieldType[] = ['string','integer','number','boolean','array','object']

/** ========= 状态 ========= */
const fields = reactive<FieldRow[]>([])
const suspendingEmit = ref(false)
const hasUserEdited = ref(false)

/** ========= 工具 ========= */
const uuid = () => Math.random().toString(36).slice(2, 10)
const validName = (s: string) => /^[A-Za-z_]\w*$/.test(s)
const valuePlaceholder = (t: FieldType) => {
  if (t === 'boolean') return 'true / false'
  if (t === 'integer') return '整数，如：10'
  if (t === 'number')  return '数值，如：0.25'
  if (t === 'object')  return 'JSON 对象，如：{"a":1}'
  if (t === 'array')   return 'JSON 数组，如：[1,2,3]'
  return '字符串'
}

/** ========= 字段操作 ========= */
function addField() {
  fields.push({ id: uuid(), name: '', parentPath: '', type: 'string', required: false, valueText: '' })
  hasUserEdited.value = true
}
function del(i: number) { fields.splice(i, 1); hasUserEdited.value = true }
function dup(i: number) { fields.splice(i + 1, 0, { ...structuredClone(fields[i]), id: uuid() }); hasUserEdited.value = true }
function move(i: number, d: number) {
  const j = i + d
  if (j < 0 || j >= fields.length) return
  const it = fields.splice(i, 1)[0]
  fields.splice(j, 0, it)
  hasUserEdited.value = true
}

/** ========= YAML -> 字段（递归扁平化，值转字符串） ========= */
function inferType(v: any): FieldType {
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'string') return 'string'
  if (t === 'boolean') return 'boolean'
  if (t === 'number') return Number.isInteger(v) ? 'integer' : 'number'
  if (v && t === 'object') return 'object'
  return 'string'
}
function toValueText(v: any, t: FieldType): string {
  if (t === 'object' || t === 'array') {
    try { return JSON.stringify(v) } catch { return '' }
  }
  return String(v)
}
function flattenWithValues(obj: any, basePath = ''): FieldRow[] {
  const out: FieldRow[] = []
  for (const [k, v] of Object.entries(obj || {})) {
    if (!validName(k)) continue
    const t = inferType(v)
    const row: FieldRow = {
      id: uuid(),
      name: k,
      parentPath: basePath,
      type: t,
      required: false,
      valueText: toValueText(v, t),
    }
    out.push(row)
    if (t === 'object') out.push(...flattenWithValues(v, basePath ? `${basePath}.${k}` : k))
    if (t === 'array' && Array.isArray(v) && v.length && typeof v[0] === 'object')
      out.push(...flattenWithValues(v[0], (basePath ? `${basePath}.${k}` : k) + '[0]'))
  }
  return out
}
function loadFromPlainObject(obj: any) { replaceFields(flattenWithValues(obj, '')) }
function replaceFields(rows: FieldRow[]) {
  suspendingEmit.value = true
  fields.splice(0, fields.length, ...rows)
  suspendingEmit.value = false
}

/** 外部 YAML 变化 -> 解析字段（不回写） */
watch(() => props.sourceYaml, (y) => {
  try {
    const { data, error } = yamlToObject(y || '')
    if (error || !data) return
    if (data && typeof data === 'object') {
      loadFromPlainObject(data)
      hasUserEdited.value = false // 初始化/外部导入不回写
    }
  } catch { /* ignore */ }
}, { immediate: true })

/** ========= 字段 -> 普通配置对象（尝试把 valueText 转成目标类型） ========= */
function deepEnsureObject(target: any, path: string[]) {
  let cur = target
  for (const p of path) {
    if (!p) continue
    if (!cur[p] || typeof cur[p] !== 'object' || Array.isArray(cur[p])) cur[p] = {}
    cur = cur[p]
  }
  return cur
}
function castFromText(type: FieldType, text: string): any {
  const raw = (text ?? '').trim()
  if (!raw.length) {
    // 空值：object->{}，array->[]，其余留空字符串
    if (type === 'object') return {}
    if (type === 'array') return []
    if (type === 'boolean') return '' // 避免误填
    if (type === 'integer' || type === 'number') return '' // 交给用户决定
    return ''
  }

  switch (type) {
    case 'boolean': {
      const lc = raw.toLowerCase()
      if (lc === 'true')  return true
      if (lc === 'false') return false
      return raw // 非 true/false 时保留原字符串
    }
    case 'integer': {
      const n = parseInt(raw, 10)
      return Number.isNaN(n) ? raw : n
    }
    case 'number': {
      const n = parseFloat(raw)
      return Number.isNaN(n) ? raw : n
    }
    case 'object':
    case 'array': {
      try { return JSON.parse(raw) } catch { return raw } // 解析失败时保留字符串
    }
    default:
      return raw
  }
}
const plainObject = computed(() => {
  const root: any = {}
  // 先父后子：按层级深度排序
  const sorted = [...fields].sort((a, b) =>
    (a.parentPath?.split('.').filter(Boolean).length ?? 0) -
    (b.parentPath?.split('.').filter(Boolean).length ?? 0)
  )
  for (const f of sorted) {
    if (!validName(f.name || '')) continue
    const parentSegments = (f.parentPath || '').split('.').filter(Boolean)
    const parentObj = deepEnsureObject(root, parentSegments)

    // object/array 允许输入字符串（JSON）；否则就占位空对象/数组
    if (f.type === 'object' || f.type === 'array') {
      const val = castFromText(f.type, f.valueText)
      if (val === '' || val === undefined) {
        // 输入为空：只保证容器存在
        if (!parentObj[f.name]) parentObj[f.name] = f.type === 'object' ? {} : []
      } else {
        parentObj[f.name] = val
      }
    } else {
      parentObj[f.name] = castFromText(f.type, f.valueText)
    }
  }
  return root
})

/** 只有用户在列表侧编辑后才回写；首次/外部 YAML 同步不回写 */
watch(plainObject, (obj) => {
  if (suspendingEmit.value) return
  if (!hasUserEdited.value) return
  const { yaml } = objectToYaml(obj as any)
  emit('update-yaml', yaml)
}, { deep: true })

/** 任何字段变更都视为用户编辑 */
watch(fields, () => { hasUserEdited.value = true }, { deep: true })
</script>

<style scoped>
.designer{ width:100%; display:flex; flex-direction:column; gap:12px }
.toolbar{ display:flex; align-items:center; gap:10px }
.hint{ opacity:.65; font-size:12px }

.panel{
  width:100%; display:block;
  background:#0f172a; border:1px solid #1f2937; border-radius:12px;
  box-shadow:0 8px 20px rgba(0,0,0,.25); overflow:hidden;
}
.panel-head{
  display:flex; align-items:center; padding:10px 12px;
  border-bottom:1px solid #1f2937; background:linear-gradient(180deg,#0f172a,#0f172acc)
}
.title{ font-size:15px; opacity:.9 }
.panel-body{ background:#0e1627; box-shadow:inset 0 0 0 1px rgba(255,255,255,.02); padding:12px }

.list-body{ width:100%; overflow:auto; max-height:420px; padding-bottom:8px }

.table{ width:100%; min-width:1280px; border-collapse:separate; border-spacing:0 8px }
th, td{ vertical-align:middle; padding:10px; white-space:nowrap }
th{ font-weight:700; opacity:.9; text-align:left }
td.center{ text-align:center }

.inp,.sel{ width:80%; background:#0b1220; border:1px solid #1f2937; border-radius:8px; color:#e5e7eb; padding:8px 10px }
.inp.invalid{ border-color:#b91c1c }
.tip{ color:#fca5a5; font-size:12px; margin-top:6px }

.ops{ display:flex; gap:8px }
.empty{ opacity:.7; text-align:center }

/* 开关 */
.switch{ position:relative; display:inline-block; width:38px; height:22px }
.switch input{ opacity:0; width:0; height:0 }
.switch span{ position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background:#1f2937; border-radius:999px; transition:.2s }
.switch span:before{ position:absolute; content:""; height:16px; width:16px; left:3px; top:3px; background:#e5e7eb; border-radius:50%; transition:.2s }
.switch input:checked + span{ background:#2563eb }
.switch input:checked + span:before{ transform:translateX(16px) }

/* 按钮 */
.btn{ padding:8px 12px; border-radius:10px; border:1px solid #374151; background:#111827; color:#e5e7eb; cursor:pointer; font-size:13px }
.btn.primary{ background:#2563eb; border-color:#1d4ed8 }
.btn.ghost{ background:#172033 }
.btn.danger{ background:#b91c1c; border-color:#7f1d1d; color:#fff }
</style>
