export function generateProtoFromObject(
  obj: Record<string, unknown>,
  name: string = 'SomeMessage'
): string {
  let result = 'syntax = "proto3";\n\n'
  const messages: string[] = []

  function toMessage(o: Record<string, unknown>, msgName: string) {
    let fields = ''
    let index = 1
    for (const [key, value] of Object.entries(o)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        const subMsg = key.charAt(0).toUpperCase() + key.slice(1)
        fields += `  ${subMsg} ${key} = ${index++};\n`
        toMessage(value as Record<string, unknown>, subMsg)
      } else {
        // 沿用原有规则：boolean -> bool，其他 -> string:contentReference[oaicite:5]{index=5}
        const type = typeof value === 'boolean' ? 'bool' : 'string'
        fields += `  ${type} ${key} = ${index++};\n`
      }
    }
    messages.push(`message ${msgName} {\n${fields}}\n`)
  }

  toMessage(obj, name)
  return result + messages.reverse().join('\n')
}
