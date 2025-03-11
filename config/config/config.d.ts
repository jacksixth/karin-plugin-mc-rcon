export interface Config {
  servers: {
    alias: string //服务器别名
    host: string //服务器host
    port: number //服务器端口 默认25565
    rconPort: number //服务器rcon端口 默认25575
    password: string //服务器rcon密码 默认123456 建议复杂点
  }[]
}
