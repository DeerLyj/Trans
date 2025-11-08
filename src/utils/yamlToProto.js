import { yamlToObject } from './yamlTools.js'
import { generateProtoFromObject } from './protoGen.js'

export function yamlToProto(yamlStr, rootName = 'SomeMessage') {
  const { data } = yamlToObject(yamlStr || '')
  return generateProtoFromObject(data || {}, rootName)
}
