<template>
  <section class="panel">
    <header class="panel-head">
      <div class="title">{{ title }}</div>
      <div class="spacer"></div>
      <button class="chip" @click="copy">复制</button>
      <button class="chip" @click="download">下载 .proto</button>
    </header>
    <div class="panel-body" :style="{height: bodyHeight}">
      <pre class="code"><code class="language-protobuf">{{ code }}</code></pre>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  code: string
  title?: string
  filename?: string
  /** 与左侧一致的可视高度（px） */
  panelHeight?: number
}>(), { title: 'Protobuf 代码预览（自动从 YAML 推断）', filename: 'schema.proto', panelHeight: 480 })

const bodyHeight = `${Math.max(240, props.panelHeight - 48)}px`

async function copy(){ try{ await navigator.clipboard.writeText(props.code||'') }catch{} }
function download(){
  const blob = new Blob([props.code||''],{type:'text/plain;charset=utf-8'})
  const url = URL.createObjectURL(blob); const a=document.createElement('a')
  a.href=url; a.download=props.filename||'schema.proto'; document.body.appendChild(a); a.click(); a.remove()
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

.panel-body{
  overflow: auto;
  padding: 12px;
  background:#0e1627;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.02);
}
.code{
  padding:0;margin:0;white-space:pre;min-height:100%;
  font-size:13px;line-height:1.6;overflow:auto;
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace
}
</style>
