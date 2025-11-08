<script setup>
import { shallowRef, watch } from 'vue'
import MonacoEditor from '@guolao/vue-monaco-editor'

const props = defineProps({
  modelValue: { type: String, default: '' },
  language:   { type: String, default: 'yaml' }, // yaml | xml | proto
  readOnly:   { type: Boolean, default: false },
  height:     { type: String, default: '100%' }
})
const emit = defineEmits(['update:modelValue', 'mount'])

const valueRef  = shallowRef(props.modelValue)
const editorRef = shallowRef(null)
const monacoRef = shallowRef(null)

watch(() => props.modelValue, v => (valueRef.value = v))

function handleMount(editor, monaco) {
  editorRef.value = editor
  monacoRef.value = monaco
  editor.updateOptions({
    automaticLayout: true,
    folding: true,                // ✅ 代码折叠
    wordWrap: 'off',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    readOnly: props.readOnly,
    fontSize: 13,
    roundedSelection: true,
    renderWhitespace: 'selection',
    tabSize: 2,
    padding: { top: 8, bottom: 8 }
  })
  emit('mount', { editor, monaco })
}

function handleChange(val) {
  emit('update:modelValue', val ?? '')
}

// 暴露格式化方法（父组件可通过 ref 调用）
function format() {
  const ed = editorRef.value
  ed?.getAction('editor.action.formatDocument')?.run()
}
defineExpose({ format })
</script>

<template>
  <div class="code-editor" :style="{ height }">
    <MonacoEditor
      :value="valueRef"
      :language="language"
      theme="vs-dark"
      @mount="handleMount"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.code-editor {
  border: 1px solid var(--ui-border, #33415566);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,.25);
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
  backdrop-filter: blur(6px);
}
</style>
