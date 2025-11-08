<template>
  <div class="monaco-wrap" ref="root" />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import loader from '@monaco-editor/loader'

interface Props {
  modelValue: string
  language?: 'yaml' | 'json' | 'proto' | 'xml' | string
  readonly?: boolean
  wordWrap?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'yaml',
  readonly: false,
  wordWrap: true,
})
const emit = defineEmits<{ (e:'update:modelValue', v:string): void }>()
const root = ref<HTMLElement | null>(null)

let monaco: any
let editor: any
let disposeModelWatcher: any

async function initMonaco() {
  monaco = await loader.init()

  // ===== YAML 支持（可选 monaco-yaml）=====
  try {
    // 动态加载 monaco-yaml，若未安装会走 catch
    const { setDiagnosticsOptions, configureMonacoYaml } = await import('monaco-yaml')
    // Monaco 必须先注册 language id
    monaco.languages.register({ id: 'yaml' })
    configureMonacoYaml(monaco)
    setDiagnosticsOptions({
      enableSchemaRequest: true,
      validate: true,
      hover: true,
      completion: true,
      format: true,
      schemas: [], // 需要的话可以传你的 JSON schema
    })
  } catch (_) {
    // 未安装 monaco-yaml 时，Monaco 仍会显示基本高亮（或回退到 json/plaintext）
  }
  // ===== END YAML =====

  editor = monaco.editor.create(root.value!, {
    value: props.modelValue ?? '',
    language: props.language || 'yaml',
    theme: 'vs-dark',
    readOnly: props.readonly,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    lineHeight: 22,
    // VS Code 风格滚动条
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
      alwaysConsumeMouseWheel: false,
    },
    wordWrap: props.wordWrap ? 'on' : 'off',
    tabSize: 2,
    smoothScrolling: true,
    renderWhitespace: 'selection',
    renderIndentGuides: true,
    contextmenu: true,
  })

  // v-model 双向绑定
  editor.onDidChangeModelContent(() => {
    const val = editor.getValue()
    emit('update:modelValue', val)
  })

  // 外部更改时更新编辑器
  disposeModelWatcher = watch(
    () => props.modelValue,
    (v) => {
      const cur = editor.getValue()
      if (v !== cur) editor.setValue(v ?? '')
    }
  )

  // 语言切换
  watch(
    () => props.language,
    (lang) => {
      const model = editor.getModel()
      if (model) monaco.editor.setModelLanguage(model, lang || 'yaml')
    }
  )

  // 只读切换
  watch(() => props.readonly, (ro) => editor.updateOptions({ readOnly: ro }))
}

onMounted(initMonaco)
onBeforeUnmount(() => {
  disposeModelWatcher && disposeModelWatcher()
  editor?.dispose?.()
})
</script>

<style scoped>
.monaco-wrap {
  height: 100%;
  min-height: 360px;
  background: #0e1627;
  border: 1px solid #1f2937;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
}
</style>
