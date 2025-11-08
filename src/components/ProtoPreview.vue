<script setup>
import { ref, watch } from 'vue'
import CodeEditor from './CodeEditor.vue'

const props = defineProps({
  code: { type: String, default: '' }
})
const codeRef = ref(props.code)
watch(() => props.code, v => (codeRef.value = v))
</script>

<template>
  <!-- 只读 Monaco，避免重复的工具栏/标题 -->
  <CodeEditor v-model="codeRef" language="proto" :readOnly="true" height="100%" />
</template>

<style scoped>
/* 空即可：纯内容区 */
</style>
