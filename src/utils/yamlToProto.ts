import { yamlToObject } from './yamlTools'
import { generateProtoFromObject } from './protoGen'

export function yamlToProto(yamlStr: string, rootName: string = 'SomeMessage'): string {
  const { data } = yamlToObject(yamlStr || '')
  // 与原实现一致：data 为空时传 {}，并沿用 rootName:contentReference[oaicite:9]{index=9}
  return generateProtoFromObject((data as Record<string, unknown>) || {}, rootName)
}
