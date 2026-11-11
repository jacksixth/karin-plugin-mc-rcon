export interface Config {
  servers: {
    alias: string //服务器别名
    host: string //服务器host
    port: string //服务器端口 一般是25565
    rconPort: string //服务器rcon端口 一般是25575
    password: string //服务器rcon密码 建议复杂点
  }[]
  requests: {
    id: string //申请人标识 onebot为QQ号 qqbot为openid
    nick: string //申请的MC昵称
    alias: string //申请加入的服务器别名
    time: string //申请时间
  }[]
}
