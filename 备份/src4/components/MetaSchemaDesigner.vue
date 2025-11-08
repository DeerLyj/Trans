<template>
  <div class="designer">
    <!-- 顶部工具条：新增字段 -->
    <div class="toolbar">
      <button class="btn primary" @click="addField">新增字段</button>
      <span class="hint">（此处只维护字段；生成的 YAML 会自动写入上方编辑区；手动编辑 YAML 会自动同步到此列表）</span>
    </div>

    <!-- 字段列表卡片 -->
    <section class="panel">
      <header class="panel-head"><div class="title">字段列表</div></header>

      <div class="panel-body list-body">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 200px">名称</th>
              <th style="width: 130px">类型</th>
              <th style="width: 90px">必填</th>
              <th style="width: 170px">格式（可选）</th>
              <th style="width: 200px">描述（可选）</th>
              <th>约束（min / max / pattern / enum）</th>
              <th style="width: 210px">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(f, i) in fields" :key="f.id">
              <td>
                <input class="inp" v-model="f.name" :class="{ invalid: f.name && !validName(f.name) }" placeholder="如：addr / timeout" />
                <div v-if="f.name && !validName(f.name)" class="tip">需以字母/下划线开头，只含字母数字下划线</div>
              </td>
              <td>
                <select class="sel" v-model="f.type">
                  <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
                </select>
              </td>
              <td class="center">
                <label class="switch">
                  <input type="checkbox" v-model="f.required" />
                  <span></span>
                </label>
              </td>
              <td><input class="inp" v-model="f.format" placeholder="email / uri / date-time / ipv4…" /></td>
              <td><input class="inp" v-model="f.description" placeholder="字段说明（可选）" /></td>
              <td>
                <div class="constraints">
                  <input class="inp mini" type="number" v-model.number="f.min" placeholder="min" :disabled="!isNumberLike(f.type)" />
                  <input class="inp mini" type="number" v-model.number="f.max" placeholder="max" :disabled="!isNumberLike(f.type)" />
                  <input class="inp mini" v-model="f.pattern" placeholder="pattern" />
                  <input class="inp mini" v-model="f.enumText" placeholder="enum(逗号分隔)" />
                </div>
              </td>
              <td class="ops">
                <button class="btn ghost" @click="dup(i)">复制</button>
                <button class="btn ghost" @click="move(i,-1)" :disabled="i===0">上移</button>
                <button class="btn ghost" @click="move(i,1)" :disabled="i===fields.length-1">下移</button>
                <button class="btn danger" @click="del(i)">删除</button>
              </td>
            </tr>
            <tr v-if="!fields.length">
              <td colspan="7" class="empty">暂无字段，点击上方“新增字段”开始</td>
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

/** ====== 类型定义 ====== */
type FieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object'
interface FieldRow {
  id: string
  name: string
  type: FieldType
  required: boolean
  format?: string
  description?: string
  min?: number
  max?: number
  pattern?: string
  enumText?: string  // 逗号分隔
}

const props = withDefaults(defineProps<{
  /** 上方编辑区当前 YAML（手动修改时会触发反向同步） */
  sourceYaml?: string
}>(), { sourceYaml: '' })

const TYPES: FieldType[] = ['string','integer','number','boolean','array','object']
const emit = defineEmits<{ (e: 'update-yaml', yaml: string): void }>()
const fields = reactive<FieldRow[]>([])

/** 工具 */
const uuid = () => Math.random().toString(36).slice(2, 10)
const isNumberLike = (t: FieldType) => t === 'integer' || t === 'number'
const notEmpty = (s: string | null | undefined): s is string => !!s && s.trim() !== ''
const validName = (s: string) => /^[A-Za-z_]\w*$/.test(s)

/** ========== 从 YAML 反向导入字段（支持两种结构） ==========
 * A) schema-like：
 *    { type: 'object', required: [...], properties: { foo: {type,format,...}, ... } }
 * B) 普通对象（自动推断类型）：
 *    { foo: "bar", n: 1, ok: true, nested: {...}, arr: [...] }
 */
function inferType(v: any): FieldType {
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'string') return 'string'
  if (t === 'boolean') return 'boolean'
  if (t === 'number') return Number.isInteger(v) ? 'integer' : 'number'
  if (v && typeof v === 'object') return 'object'
  return 'string'
}

function loadFromSchemaLike(obj: any) {
  const requiredSet = new Set<string>(Array.isArray(obj.required) ? obj.required : [])
  const props = obj.properties && typeof obj.properties === 'object' ? obj.properties : {}
  const rows: FieldRow[] = []
  for (const [key, v] of Object.entries(props as Record<string, any>)) {
    const val = v as any
    rows.push({
      id: uuid(),
      name: key,
      type: (val?.type as FieldType) || 'string',
      required: requiredSet.has(key),
      format: val?.format,
      description: val?.description,
      min: typeof val?.minimum === 'number' ? val.minimum : undefined,
      max: typeof val?.maximum === 'number' ? val.maximum : undefined,
      pattern: typeof val?.pattern === 'string' ? val.pattern : undefined,
      enumText: Array.isArray(val?.enum) ? (val.enum as any[]).join(', ') : undefined,
    })
  }
  replaceFields(rows)
}

function loadFromPlainObject(obj: any) {
  // 仅取第一层键，推断基础类型与枚举/约束为空
  const rows: FieldRow[] = []
  for (const [key, v] of Object.entries(obj)) {
    if (!validName(key)) continue
    rows.push({
      id: uuid(),
      name: key,
      type: inferType(v),
      required: false,
    })
  }
  replaceFields(rows)
}

function replaceFields(rows: FieldRow[]) {
  suspendingEmit.value = true
  fields.splice(0, fields.length, ...rows)
  suspendingEmit.value = false
}

/** 监听外部 YAML：解析后填充字段列表（不回写，防环路） */
const suspendingEmit = ref(false)
watch(() => props.sourceYaml, (y) => {
  const { data, error } = yamlToObject(y || '')
  if (error || !data) return
  if (data && typeof data === 'object') {
    if (data.type === 'object' && data.properties) {
      loadFromSchemaLike(data)
    } else {
      loadFromPlainObject(data)
    }
  }
}, { immediate: true })

/** ========== 由字段生成 YAML（schema-like）并回写上方编辑区 ========== */
const yamlObject = computed(() => {
  const required = fields
    .filter(f => f.required && validName(f.name))
    .map(f => f.name.trim())

  const properties: Record<string, any> = {}

  for (const f of fields) {
    const name = f.name?.trim()
    if (!validName(name || '')) continue

    const node: Record<string, any> = { type: f.type }
    if (notEmpty(f.description)) node.description = f.description!.trim()
    if (notEmpty(f.format)) node.format = f.format!.trim()

    if (isNumberLike(f.type)) {
      if (Number.isFinite(f.min!)) node.minimum = f.min
      if (Number.isFinite(f.max!)) node.maximum = f.max
      if (Number.isFinite(f.min!) && Number.isFinite(f.max!) && f.min! > f.max!) {
        const t = node.minimum; node.minimum = node.maximum; node.maximum = t
      }
    }

    if (notEmpty(f.pattern)) {
      try { new RegExp(f.pattern!) ; node.pattern = f.pattern }
      catch { /* 无效正则忽略 */ }
    }

    if (notEmpty(f.enumText)) {
      const arr = f.enumText!.split(',').map(s => s.trim()).filter(notEmpty)
      if (f.type === 'boolean') node.enum = arr.filter(v => v === 'true' || v === 'false')
      else if (isNumberLike(f.type)) node.enum = arr.filter(v => !Number.isNaN(Number(v))).map(v => Number(v))
      else node.enum = arr
      if (!node.enum?.length) delete node.enum
    }

    properties[name] = node
  }

  return { title: 'metadata-template', type: 'object', required, properties }
})

const hasUserEdited = ref(false)

// 只要字段内容有改动，就标记为用户编辑过
watch(fields, () => { hasUserEdited.value = true }, { deep: true })

watch(yamlObject, (obj) => {
  if (suspendingEmit.value) return          // 正在从 YAML 导入字段，不回写
  if (!hasUserEdited.value) return          // 用户还没动过字段，不回写
  const { yaml } = objectToYaml(obj as any)
  emit('update-yaml', yaml)
}, { deep: true })                          // ← 没有 immediate

</script>

<style scoped>
/* 宽度铺满 + 表格可横向滚动（避免被压缩狭窄） */
.designer{ width:100%; display:flex; flex-direction:column; gap:12px }
.toolbar{ display:flex; align-items:center; gap:10px }
.hint{ opacity:.6; font-size:12px }

.panel{ width:100%; display:block; background:#0f172a; border:1px solid #1f2937; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,.25); overflow:hidden }
.panel-head{ display:flex; align-items:center; padding:10px 12px; border-bottom:1px solid #1f2937; background:linear-gradient(180deg,#0f172a,#0f172acc) }
.title{ font-size:13px; opacity:.9 }
.panel-body{ background:#0e1627; box-shadow:inset 0 0 0 1px rgba(255,255,255,.02); padding:12px }
.list-body{ width:100%; overflow:auto; max-height:420px; padding-bottom:8px }

.table{ width:100%; min-width:1200px; border-collapse:separate; border-spacing:0 8px }
th, td{ vertical-align:middle; padding:8px; white-space:nowrap }
th{ font-weight:700; opacity:.9; text-align:left }
td.center{ text-align:center }

.inp,.sel{ width:100%; background:#0b1220; border:1px solid #1f2937; border-radius:8px; color:#e5e7eb; padding:8px 10px }
.inp.mini{ max-width:150px }
.inp.invalid{ border-color:#b91c1c }
.tip{ color:#fca5a5; font-size:12px; margin-top:6px }

.constraints{ display:flex; flex-wrap:wrap; gap:8px }
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
