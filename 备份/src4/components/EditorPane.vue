<template>
  <div class="grid2">
    <!-- 左：编辑区（仅 Monaco 自身滚动） -->
    <section class="panel">
      <header class="panel-head">
        <div class="title">编辑区</div>
        <div class="spacer"></div>
        <span class="err" v-if="errorTip">{{ errorTip }}</span>
        <button class="chip" @click="$emit('format')">格式化</button>
      </header>
      <div class="panel-body" :style="{ height: bodyHeight }">
        <CodeEditor v-model="innerYaml" language="yaml" word-wrap />
      </div>
    </section>

    <!-- 右：Proto 预览（与左侧同款 Monaco） -->
    <ProtoPreview
      :code="protoText"
      :panel-height="paneHeight"
      title="Protobuf 代码预览（自动从 YAML 推断）"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CodeEditor from './CodeEditor.vue'
import ProtoPreview from './ProtoPreview.vue'
import { yamlToObject } from '@/utils/yamlTools'
import { yamlToProto } from '@/utils/yamlToProto'

const props = withDefaults(defineProps<{
  modelValue: string
  protoRootName?: string
  paneHeight?: number
}>(), { modelValue: '', protoRootName: 'SomeMessage', paneHeight: 480 })
const emit = defineEmits<{ (e:'update:modelValue', v:string):void; (e:'format'):void }>()

const innerYaml = ref(props.modelValue)
watch(() => props.modelValue, v => { if (v !== innerYaml.value) innerYaml.value = v ?? '' })
watch(innerYaml, v => emit('update:modelValue', v))

const errorTip = ref('')

const protoText = computed(() => {
  try{
    errorTip.value = ''
    const { error } = yamlToObject(innerYaml.value || '')
    if (error) { errorTip.value = 'YAML 语法错误'; return '// invalid yaml' }
    return yamlToProto(innerYaml.value || '', props.protoRootName || 'SomeMessage')
  }catch{ errorTip.value='转换失败'; return '// transform failed' }
})

const bodyHeight = computed(() => `${Math.max(240, (props.paneHeight ?? 480) - 48)}px`)
</script>

<style scoped>
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
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
.err{color:#fca5a5;font-size:12px;margin-right:6px}
.chip{
  border:1px solid #374151;border-radius:999px;padding:6px 12px;font-size:12px;cursor:pointer;
  background:#111827;color:#e5e7eb
}
.chip:hover{background:#2563eb}

/* 关键：不让外层再滚动，只由 Monaco 滚动 */
.panel-body{
  overflow: hidden;
  padding: 12px;
  background:#0e1627;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
}
</style>
