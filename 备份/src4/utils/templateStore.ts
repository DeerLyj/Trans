// 本地模板类型
export interface TemplateItem {
  id: string
  name: string
  desc: string
  yaml: string
  createdAt: string | null
  updatedAt: string | null
}

const KEY = 'templates_v1'

function _now(): string {
  return new Date().toISOString()
}
function _uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function _loadAll(): TemplateItem[] {
  try {
    const s = localStorage.getItem(KEY)
    return s ? (JSON.parse(s) as TemplateItem[]) : []
  } catch (e) {
    console.warn('read localStorage failed:', e)
    return []
  }
}
function _saveAll(list: TemplateItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

/** 最新的排前（与原实现保持一致）:contentReference[oaicite:6]{index=6} */
export function listTemplates(): TemplateItem[] {
  return _loadAll().sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
  )
}

export function getTemplate(id: string): TemplateItem | null {
  return _loadAll().find(t => t.id === id) || null
}

export function upsertTemplate(args: {
  id?: string
  name?: string
  desc?: string
  yaml?: string
}): string {
  const list = _loadAll()
  const now = _now()
  let { id, name, desc, yaml } = args

  if (!id) {
    // 新建模板（保持 createdAt 与 updatedAt 行为与原版一致）:contentReference[oaicite:7]{index=7}
    id = _uuid()
    list.push({
      id,
      name: name || '未命名模板',
      desc: desc || '',
      yaml: yaml || '',
      createdAt: now,
      updatedAt: null,
    })
  } else {
    // 编辑已存在模板
    const i = list.findIndex(t => t.id === id)
    if (i >= 0) {
      const original = list[i]
      list[i] = {
        ...original,
        name: name ?? original.name,
        desc: desc ?? original.desc,
        yaml: yaml ?? original.yaml,
        updatedAt: now,
      }
    } else {
      // 未找到则按新建处理
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
  return id!
}

export function deleteTemplate(id: string): void {
  const list = _loadAll()
  const next = list.filter(t => t.id !== id)
  _saveAll(next)
}

export function createBlankTemplate(): string {
  const id = _uuid()
  const now = _now()
  const tpl: TemplateItem = {
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

export function formatTime(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
