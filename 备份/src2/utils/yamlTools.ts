import YAML from 'js-yaml'

// 与原来返回结构一致：成功 {data, error:null}；失败 {data:null, error}:contentReference[oaicite:8]{index=8}
export function yamlToObject(
  str: string = ''
): { data: unknown | null; error: unknown | null } {
  try {
    const data = YAML.load(str)
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export function objectToYaml(
  obj: Record<string, unknown> = {}
): { yaml: string; error: unknown | null } {
  try {
    const yaml = YAML.dump(obj, { indent: 2 })
    return { yaml, error: null }
  } catch (error) {
    return { yaml: '', error }
  }
}
