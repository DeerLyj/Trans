<template>
  <section class="panel">
    <header class="panel-head">
      <div class="title">{{ title }}</div>
      <div class="spacer"></div>
      <button class="chip" @click="copy">复制</button>
      <button class="chip" @click="download">下载 .proto</button>
    </header>

    <!-- 高度由父组件传入；外层不滚动，只保留 Monaco 滚轮 -->
    <div class="panel-body" :style="{ height: bodyHeight }">
      <div class="monaco-wrap" ref="root"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'
import loader from '@monaco-editor/loader'

const props = withDefaults(defineProps<{
  code: string
  title?: string
  filename?: string
  panelHeight?: number
}>(), {
  title: 'Protobuf 代码预览（自动从 YAML 推断）',
  filename: 'schema.proto',
  panelHeight: 480,
})

const bodyHeight = computed(() =>
  `${Math.max(240, (props.panelHeight ?? 480) - 48)}px`
)

const root = ref<HTMLElement | null>(null)
let monaco: any
let editor: any

/** 注册 protobuf 语言（Monarch 高亮） */
function registerProtoLanguage(m: any) {
  const id = 'protobuf'
  const already = m.languages.getLanguages().some((l: any) => l.id === id)
  if (already) return

  m.languages.register({ id })

  // 较完整的 Monarch 规则，覆盖关键字/类型/注释/数字/标点等
  m.languages.setMonarchTokensProvider(id, {
    defaultToken: '',
    tokenPostfix: '.proto',

    keywords: [
      'syntax','import','package','option',
      'message','enum','service','rpc','returns',
      'oneof','repeated','map','reserved','extend'
    ],

    // 常见内置类型
    types: [
      'double','float',
      'int32','int64','uint32','uint64','sint32','sint64',
      'fixed32','fixed64','sfixed32','sfixed64',
      'bool','string','bytes'
    ],

    // 字面量/标点
    operators: ['=',';',',','.','{','}','(',')','[',']','<','>'],

    symbols: /[=;,.{}()[\]<>]/,

    // 主状态
    tokenizer: {
      root: [
        // 注释
        [/\/\/.*$/, 'comment'],
        [/\/\*/, { token: 'comment', next: '@comment' }],

        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],  // 非闭合
        [/"/, { token: 'string.quote', next: '@string' }],

        // 关键字 / 类型
        [/\b(@?)([a-zA-Z_]\w*)\b/, {
          cases: {
            '@keywords': 'keyword',
            '@types': 'type',
            '@default': 'identifier'
          }
        }],

        // map<Key,Value>
        [/\bmap\s*(?=<)/, 'keyword'],
        [/<\s*[a-zA-Z_]\w*\s*,\s*[a-zA-Z_]\w*\s*>/, 'type'],

        // 数字（十进制/十六进制）
        [/\b0x[0-9a-fA-F]+\b/, 'number'],
        [/\b\d+\b/, 'number'],

        // 等号/分号等符号
        [/@symbols/, {
          cases: {
            '=': 'operator',
            '@default': 'delimiter'
          }
        }],
      ],

      // 多行注释
      comment: [
        [/[^\/*]+/, 'comment' ],
        [/\*\//,     'comment', '@pop' ],
        [/[\/*]/,    'comment' ]
      ],

      // 字符串（支持转义）
      string: [
        [/[^\\"]+/,  'string'],
        [/\\./,      'string.escape'],
        [/"/,        { token: 'string.quote', next: '@pop' } ]
      ],
    }
  })
}

async function init() {
  monaco = await loader.init()
  registerProtoLanguage(monaco)

  editor = monaco.editor.create(root.value!, {
    value: props.code ?? '',
    language: 'protobuf',
    theme: 'vs-dark',
    readOnly: true,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 22,
    wordWrap: 'off',
    renderWhitespace: 'selection',
    renderIndentGuides: true,
    smoothScrolling: true,
    contextmenu: true,
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
      alwaysConsumeMouseWheel: false,
    },
  })

  await nextTick()
  editor.setValue(props.code ?? '')
}

onMounted(init)

watch(() => props.code, (v) => {
  if (editor && typeof v === 'string' && v !== editor.getValue()) {
    editor.setValue(v)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  editor?.dispose?.()
})

async function copy(){ try{ await navigator.clipboard.writeText(props.code||'') }catch{} }
function download(){
  const blob = new Blob([props.code||''],{type:'text/plain;charset=utf-8'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=props.filename||'schema.proto'
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.panel{
  background:#0f172a;border:1px solid #1f2937;border-radius:14px;
  box-shadow:0 10px 24px rgba(0,0,0,.28);overflow:hidden
}
.panel-head{
  display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #1f2937;
  background:linear-gradient(180deg,#0f172a,#0f172acc)
}
.title{font-size:13px;opacity:.9}
.spacer{flex:1}
.chip{
  border:1px solid #374151;border-radius:999px;padding:6px 12px;font-size:12px;cursor:pointer;
  background:#111827;color:#e5e7eb
}
.chip:hover{background:#2563eb}

/* 只保留 Monaco 自身滚动条 */
.panel-body{
  overflow: hidden;
  padding: 12px;
  background:#0e1627;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
}
.monaco-wrap{
  position: relative;
  width: 100%;
  height: 100%;
  background: #0e1627;
  border-radius: 10px;
  overflow: hidden;
}
</style>
