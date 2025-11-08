export function generateProtoFromObject(obj, name = 'SomeMessage') {
  let result = 'syntax = "proto3";\n\n'
  const messages = []

  function toMessage(o, msgName) {
    let fields = ''
    let index = 1
    for (const [key, value] of Object.entries(o)) {
      if (typeof value === 'object' && value !== null) {
        const subMsg = key.charAt(0).toUpperCase() + key.slice(1)
        fields += `  ${subMsg} ${key} = ${index++};\n`
        toMessage(value, subMsg)
      } else {
        const type = typeof value === 'boolean' ? 'bool' : 'string'
        fields += `  ${type} ${key} = ${index++};\n`
      }
    }
    messages.push(`message ${msgName} {\n${fields}}\n`)
  }

  toMessage(obj, name)
  return result + messages.reverse().join('\n')
}
