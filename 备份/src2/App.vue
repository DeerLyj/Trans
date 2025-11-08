<template>
  <div class="page">
    <header class="topbar">
      <div class="topbar-left">
        <span class="dot">🎯</span>
        <h1>YAML 模板编辑器 · Proto 预览</h1>
    </div>
      <div class="topbar-right">
        <RouterLink class="btn ghost" to="/templates">模板列表</RouterLink>
        <RouterLink class="btn primary" to="/editor">新建模板</RouterLink>
      </div>
    </header>
    <main class="container"><RouterView /></main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
/* === 微光渐隐滚动条样式（推荐）=== */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.25); /* #64748b + 透明度 */
  border-radius: 10px;
  transition: all 0.25s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

::-webkit-scrollbar-thumb:active {
  background: rgba(148, 163, 184, 0.65);
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* Firefox 支持 */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.25) transparent;
}

/* 鼠标悬浮或滚动时渐入 */
.panel-body:hover::-webkit-scrollbar-thumb,
.panel-body:active::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
}

.page{min-height:100vh}
.topbar{
  position:sticky;top:0;z-index:5;
  display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;
  padding:14px 18px;background:linear-gradient(180deg,#0b1220,#0b1220f2);
  border-bottom:1px solid #1f2937;box-shadow:0 2px 8px rgba(0,0,0,.25);
}
.topbar-left{display:flex;align-items:center;gap:10px}
.dot{font-size:18px}
h1{margin:0;font-size:16px;font-weight:800;opacity:.95}
.topbar-right{display:flex;gap:10px}
.container{padding:16px;max-width:1400px;margin:0 auto}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:10px;
  border:1px solid #374151;background:#111827;color:#e5e7eb;font-size:13px;text-decoration:none}
.btn:hover{background:#1f2937}
.btn.primary{background:#2563eb;border-color:#1d4ed8}
.btn.primary:hover{filter:brightness(1.05)}
.btn.ghost{background:transparent}
</style>
