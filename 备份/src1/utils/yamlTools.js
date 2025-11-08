// 

import YAML from 'js-yaml'

export function yamlToObject(str = '') {
  try {
    const data = YAML.load(str)
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export function objectToYaml(obj = {}) {
  try {
    const yaml = YAML.dump(obj, { indent: 2 })
    return { yaml, error: null }
  } catch (error) {
    return { yaml: '', error }
  }
}
