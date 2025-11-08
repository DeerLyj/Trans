<script setup>
import { ref, computed } from 'vue'
import CodeEditor from './CodeEditor.vue'

const props = defineProps({
  yaml: { type: String, default: '' }
})
const emit = defineEmits(['update:yaml'])

const model = computed({
  get: () => props.yaml,
  set: v => emit('update:yaml', v ?? '')
})

// 内部持有编辑器引用，向外暴露 format()
const ed = ref(null)
function format() {
  ed.value?.format?.()
}
defineExpose({ format })
</script>

<template>
  <!-- 只有编辑器本体：不再渲染 YAML/XML/格式化 第二行 -->
  <CodeEditor ref="ed" v-model="model" language="yaml" height="100%" />
</template>

<style scoped>
/* 空即可：纯内容区 */
</style>
