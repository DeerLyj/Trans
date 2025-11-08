// 简单的 localStorage 模板仓库
const KEY = 'templates_v1'

function _now() {
  return new Date().toISOString()
}
function _uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function _loadAll() {
  try {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : []
  } catch (e) {
    console.warn('read localStorage failed:', e)
    return []
  }
}
function _saveAll(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function listTemplates() {
  // 最新的排前
  return _loadAll().sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
}

export function getTemplate(id) {
  return _loadAll().find(t => t.id === id) || null
}

export function upsertTemplate({ id, name, desc, yaml }) {
  const list = _loadAll()
  const now = _now()

  if (!id) {
    // 新建模板
    id = _uuid()
    list.push({
      id,
      name: name || '未命名模板',
      desc: desc || '',
      yaml: yaml || '',
      createdAt: now,
      updatedAt: null, // ✅ 初始不设为相同时间
    })
  } else {
    // 编辑已存在模板
    const i = list.findIndex(t => t.id === id)
    if (i >= 0) {
      // ✅ 保留原创建时间，只更新修改时间
      const original = list[i]
      list[i] = {
        ...original,
        name,
        desc,
        yaml,
        updatedAt: now,
      }
    } else {
      // 如果找不到原记录，就当新建
      list.push({
        id,
        name: name || '未命名模板',
        desc: desc || '',
        yaml: yaml || '',
        createdAt: now,
        updatedAt: null,
      })
    }
  }

  _saveAll(list)
  return id
}


export function deleteTemplate(id) {
  const list = _loadAll()
  const next = list.filter(t => t.id !== id)
  _saveAll(next)
}

export function createBlankTemplate() {
  const id = _uuid()
  const now = _now()
  const tpl = {
    id,
    name: '新模板',
    desc: '',
    yaml: '',
    createdAt: now,
    updatedAt: now,
  }
  const list = _loadAll()
  list.push(tpl)
  _saveAll(list)
  return id
}

export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
