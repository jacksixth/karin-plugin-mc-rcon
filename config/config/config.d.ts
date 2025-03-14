export interface Config {
  servers: {
    alias: string //服务器别名
    host: string //服务器host
    port: string //服务器端口 一般是25565
    rconPort: string //服务器rcon端口 一般是25575
    password: string //服务器rcon密码 建议复杂点
  }[]
  QQNoLinkMcNickname: {
    //QQ号与mc昵称的对应关系 用于查询玩家的mc昵称
    qqNo: string
    qqNickname: string
    mcNickname: string
  }[]
  banQQ: string[] //封禁QQ号
}
