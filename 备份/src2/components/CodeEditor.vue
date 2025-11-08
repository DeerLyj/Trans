<template>
  <div class="editor-wrap">
    <textarea
      :value="localVal"
      :readonly="readonly"
      @input="onInput(($event.target as HTMLTextAreaElement).value)"
      class="editor"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
interface Props { modelValue: string; language?: string; readonly?: boolean; placeholder?: string }
const props = withDefaults(defineProps<Props>(), { modelValue:'', language:'yaml', readonly:false, placeholder:'' })
const emit = defineEmits<{ (e:'update:modelValue', v:string):void }>()
const localVal = ref(props.modelValue)
watch(() => props.modelValue, v => { if (v !== localVal.value) localVal.value = v ?? '' })
function onInput(v: string){ localVal.value = v; emit('update:modelValue', v) }
const readonly = props.readonly; const placeholder = props.placeholder
</script>

<style scoped>
/* 关键：父容器定高，这里 100% 占满；滚动交给父容器 */
.editor-wrap{ height:100%; }
.editor{
  width:100%; height:100%;
  background:transparent; color:#e5e7eb; border:none; outline:none;
  padding:14px; line-height:1.6; resize:none; /* 禁止拖拽扩大 */
  font-size:13px;
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace
}
.editor::placeholder{color:#94a3b8;opacity:.45}
</style>
