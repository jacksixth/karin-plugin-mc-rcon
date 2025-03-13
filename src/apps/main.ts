import {
  config,
  dirConfig,
  isValidHost,
  isValidPort,
  mcMotd,
  rconClient,
} from "@/utils"
import karin, {
  segment,
  Elements,
  writeJsonSync,
  makeForward,
} from "node-karin"
//是否正在修改文件
let isWriteJSON = false
//motd查询 #motd <host>:<port> | #motd <host> <port>
export const motd = karin.command(
  /^#motd\s+([a-z0-9.-]+)(?::(\d+)|\s+(\d+))$/i,
  async (e) => {
    const regRes = e.msg.match(/^#?motd\s+([a-z0-9.-]+)(?::(\d+)|\s+(\d+))$/i)
    if (!regRes) {
      //不可能会走到这里
      return
    } else {
      const _config = config()
      if (_config.banQQ.includes(e.sender.userId)) {
        e.reply("❌ 你被封禁了", { reply: true })
      }
      const host = regRes[1]
      const port = regRes[2] || regRes[3]
      // 添加端口默认值处理
      const defaultPort = 25565
      const parsedPort = port ? parseInt(port) : defaultPort

      // 合法性校验
      if (!isValidHost(host)) {
        e.reply("❌ 无效的主机名格式", { reply: true })
        return
      }
      if (parsedPort < 1 || parsedPort > 65535) {
        e.reply("❌ 端口号需在 1-65535 之间", { reply: true })
        return
      }
      const data = await mcMotd(host, parsedPort)
      if (data) {
        let msgList = []
        msgList.push(segment.text(data.type + " " + data.version + "\n"))
        if (data.favicon) {
          msgList.push(segment.image(data.favicon))
        }
        msgList.push(
          segment.text(data.players.online + "/" + data.players.max + "\n")
        )
        if (data.description)
          msgList.push(segment.text(data.description + "\n"))
        e.bot.sendMsg(e.contact, msgList)
      } else {
        e.reply("❌ 获取服务器状态失败，可能是服务器未开启。", { reply: true })
      }
    }
  },
  {
    name: "mc-motd", // 插件名称
    log: true,
  }
)
// 添加服务器 #server add <host> <port> <rconPort> <password> <serverAlias>
export const addServer = karin.command(
  /^#server add (\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/i,
  async (e) => {
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
      return
    }
    if (e.contact.scene != "friend" && e.contact.scene != "groupTemp") {
      e.reply("❌ 请在私聊中添加服务器", { reply: true })
      return
    }
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限添加服务器", { reply: true })
      return
    }
    const regRes = e.msg.match(
      /^#server add (\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/i
    )
    if (!regRes) {
      //不可能会走到这里
      return
    } else {
      const [_, host, port, rconPort, password, alias] = regRes
      // 合法性校验
      if (!isValidHost(host)) {
        e.reply("❌ 无效的host格式", { reply: true })
        return
      }
      if (!isValidPort(port) || !isValidPort(rconPort)) {
        e.reply("❌ 无效的端口号格式", { reply: true })
        return
      }
      // 保存服务器信息
      const _config = config()
      _config.servers.push({
        alias,
        host,
        port: port,
        rconPort: rconPort,
        password,
      })
      isWriteJSON = true
      writeJsonSync(`${dirConfig}/config.json`, _config)
      e.reply(
        "✅ 服务器添加成功,当前存在服务器：" +
          _config.servers.map((item) => item.alias).join(","),
        { reply: true }
      )
      isWriteJSON = false
    }
  },
  {
    name: "mc-add-server", // 插件名称
    log: true,
  }
)
// 删除服务器 #server remove <serverAlias>
export const removeServer = karin.command(
  /^#server remove (\S+)$/i,
  async (e) => {
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
      return
    }
    if (e.contact.scene != "friend" && e.contact.scene != "groupTemp") {
      e.reply("❌ 请在私聊中添加服务器", { reply: true })
      return
    }
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限删除服务器", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#server remove (\S+)$/i)
    if (!regRes) {
      //不可能会走到这里
      return
    } else {
      const [_, alias] = regRes
      // 保存服务器信息
      const _config = config()
      //查找是否存在该服务器
      if (!_config.servers.find((item) => item.alias === alias)) {
        e.reply(
          "❌ 不存在该服务器,当前存在服务器：" +
            _config.servers.map((item) => item.alias).join(","),
          { reply: true }
        )
        return
      } else {
        _config.servers = _config.servers.filter((item) => item.alias !== alias)
        isWriteJSON = true
        writeJsonSync(`${dirConfig}/config.json`, _config)
        e.reply(
          "✅ 服务器删除成功,当前存在服务器：" +
            _config.servers.map((item) => item.alias).join(","),
          { reply: true }
        )
        isWriteJSON = false
      }
    }
  },
  {
    name: "mc-remove-server", // 插件名称
    log: true,
  }
)
//列出所有服务器信息（伪造转发消息防刷屏） #server list
let isListing = false
export const listServer = karin.command(/^#server list$/i, async (e) => {
  const _config = config()
  if (_config.banQQ.includes(e.sender.userId)) {
    e.reply("❌ 你被封禁了", { reply: true })
  }
  if (isListing) {
    e.reply("❌ 已经正在查询服务器详情了，请耐心等待", { reply: true })
    return
  }
  if (_config.servers.length === 0) {
    e.reply("❌ 服务器列表为空"), { reply: true }
    return
  }

  let nodeMsg = []
  for (let index = 0; index < _config.servers.length; index++) {
    let msgList = []
    const element = _config.servers[index]
    msgList.push(
      segment.text(
        `${element.alias} ${element.host}${
          element.port == "25565" ? ":" + element.port : ""
        }\n`
      )
    )
    try {
      const motd = await mcMotd(element.host, parseInt(element.port))
      if (motd) {
        if (motd.favicon) {
          msgList.push(segment.image(motd.favicon))
        }
        if (motd.description) {
          msgList.push(segment.text(motd.description + "\n"))
        }
        msgList.push(
          segment.text(
            `服务器版本：${motd.type} ${motd.version}\n服务器人数:${motd.players.online}/${motd.players.max}\n`
          )
        )
        const rcon = new rconClient(
          element.host,
          element.rconPort,
          element.password
        )
        try {
          const listRes = await rcon.send("list")
          if (listRes) {
            //返回的list信息处理 中文冒号和英文冒号都可能存在
            //There are 2 of a max of 99 players online: xxx1, xxxx2
            if (listRes.includes(":") && listRes.split(":").length > 1)
              msgList.push(
                segment.text("在线玩家：" + listRes.split(":")[1] + "\n")
              )
            else if (listRes.includes("：") && listRes.split("：").length > 1)
              msgList.push(
                segment.text("在线玩家：" + listRes.split("：")[1] + "\n")
              )
          }
        } catch (error) {
          msgList.push(segment.text("获取在线玩家数据失败\n"))
        }
      }
    } catch (error) {
      msgList.push(segment.text("获取服务器信息失败\n"))
    }
    nodeMsg.push(
      segment.node(e.bot.account.selfId, e.bot.account.name, msgList)
    )
  }
  e.bot.sendMsg(e.contact, nodeMsg)
  isListing = false
})
//查看单个服务器详情 #server info <serverAlias>
export const serverInfo = karin.command(/^#server info (\S+)$/i, async (e) => {
  const _config = config()
  if (_config.banQQ.includes(e.sender.userId)) {
    e.reply("❌ 你被封禁了", { reply: true })
  }
  if (isListing) {
    e.reply("❌ 已经正在查询服务器详情了，请耐心等待", { reply: true })
    return
  }
  const regRes = e.msg.match(/^#server info (\S+)$/i)
  if (!regRes) {
    //不可能会走到这里
    return
  }
  const [_, alias] = regRes
  const findServer = _config.servers.find((item) => item.alias === alias)
  if (!findServer) {
    e.reply(
      "❌ 不存在该服务器，当前存在服务器" +
        _config.servers.map((item) => item.alias).join(","),
      { reply: true }
    )
    return
  }
  let msgList = []
  msgList.push(
    segment.text(
      `${findServer.alias} ${findServer.host}${
        findServer.port == "25565" ? ":" + findServer.port : ""
      }\n`
    )
  )
  try {
    const motd = await mcMotd(findServer.host, parseInt(findServer.port))
    if (motd) {
      if (motd.favicon) {
        msgList.push(segment.image(motd.favicon))
      }
      if (motd.description) {
        msgList.push(segment.text(motd.description + "\n"))
      }
      msgList.push(
        segment.text(
          `服务器版本：${motd.type} ${motd.version}\n服务器人数:${motd.players.online}/${motd.players.max}\n`
        )
      )
      const rcon = new rconClient(
        findServer.host,
        findServer.rconPort,
        findServer.password
      )
      try {
        const listRes = await rcon.send("list")
        if (listRes) {
          //返回的list信息处理 中文冒号和英文冒号都可能存在
          //There are 2 of a max of 99 players online: xxx1, xxxx2
          if (listRes.includes(":") && listRes.split(":").length > 1)
            msgList.push(
              segment.text("在线玩家：" + listRes.split(":")[1] + "\n")
            )
          else if (listRes.includes("：") && listRes.split("：").length > 1)
            msgList.push(
              segment.text("在线玩家：" + listRes.split("：")[1] + "\n")
            )
        }
      } catch (error) {
        msgList.push(segment.text("获取在线玩家数据失败\n"))
      }
    }
  } catch (error) {
    msgList.push(segment.text("获取服务器信息失败\n"))
  }
  e.reply(msgList, { reply: true })
  isListing = false
})
// 开启服务器白名单（管理员专属） `#server wlon <serverAlias>`
export const wlon = karin.command(/^#server wlon (\S+)$/i, async (e) => {
  const _config = config()
  if (!e.isAdmin && !e.isMaster) {
    e.reply("❌ 你没有权限开启服务器白名单", { reply: true })
    return
  }
  const regRes = e.msg.match(/^#server wlon (\S+)$/i)
  if (!regRes) {
    return
  }
  const [_, alias] = regRes
  const findServer = _config.servers.find((item) => item.alias === alias)
  if (!findServer) {
    e.reply(
      "❌ 不存在该服务器，当前存在服务器" +
        _config.servers.map((item) => item.alias).join(","),
      { reply: true }
    )
    return
  }
  try {
    const rcon = new rconClient(
      findServer.host,
      findServer.rconPort,
      findServer.password
    )
    await rcon.send("whitelist on")
    e.reply("✅ 服务器白名单已开启", { reply: true })
  } catch (error) {
    e.reply("❌ 服务器白名单开启失败", { reply: true })
  }
})
// 关闭服务器白名单（管理员专属） `#server wloff <serverAlias>`
export const wloff = karin.command(/^#server wloff (\S+)$/i, async (e) => {
  const _config = config()
  if (!e.isAdmin && !e.isMaster) {
    e.reply("❌ 你没有权限关闭服务器白名单", { reply: true })
    return
  }
  const regRes = e.msg.match(/^#server wloff (\S+)$/i)
  if (!regRes) {
    return
  }
  const [_, alias] = regRes
  const findServer = _config.servers.find((item) => item.alias === alias)
  if (!findServer) {
    e.reply(
      "❌ 不存在该服务器，当前存在服务器" +
        _config.servers.map((item) => item.alias).join(","),
      { reply: true }
    )
    return
  }
  try {
    const rcon = new rconClient(
      findServer.host,
      findServer.rconPort,
      findServer.password
    )
    await rcon.send("whitelist off")
    e.reply("✅ 服务器白名单已关闭", { reply: true })
  } catch (error) {
    e.reply("❌ 服务器白名单关闭失败", { reply: true })
  }
})
// 查看服务器白名单（管理员专属） `#server wllist <serverAlias>`
export const wllist = karin.command(/^#server wllist (\S+)$/i, async (e) => {
  const _config = config()
  if (!e.isAdmin && !e.isMaster) {
    e.reply("❌ 你没有权限开启服务器白名单", { reply: true })
    return
  }
  const regRes = e.msg.match(/^#server wllist (\S+)$/i)
  if (!regRes) {
    return
  }
  const [_, alias] = regRes
  const findServer = _config.servers.find((item) => item.alias === alias)
  if (!findServer) {
    e.reply(
      "❌ 不存在该服务器，当前存在服务器" +
        _config.servers.map((item) => item.alias).join(","),
      { reply: true }
    )
    return
  }
  try {
    const rcon = new rconClient(
      findServer.host,
      findServer.rconPort,
      findServer.password
    )
    const res = await rcon.send("whitelist list")
    if (res) {
      if (res.includes(":") && res.split(":").length > 1)
        e.reply("✅ 服务器白名单列表：" + res.split(":")[1], { reply: true })
      else if (res.includes("：") && res.split("：").length > 1)
        e.reply("✅ 服务器白名单列表：" + res.split("：")[1], { reply: true })
      else e.reply("✅ 服务器白名单列表为空")
    }
  } catch (error) {
    e.reply("❌ 查看服务器白名单失败", { reply: true })
  }
})
// 向单个/所有服务器发送 RCON 命令（管理员专属） #rcon <serverAlias|ALL> <commend>
let isSending = false
export const rcon = karin.command(/^#rcon (\S+) (.+)$/i, async (e) => {
  if (!e.isAdmin && !e.isMaster) {
    e.reply("❌ 你没有权限使用该功能", { reply: true })
    return
  } else {
    if (isSending) {
      e.reply("❌ 已有命令正在执行，请等待当前命令完成", { reply: true })
      return
    }
    isSending = true
    const _config = config()
    const regRes = e.msg.match(/^#rcon (\S+) (.+)$/i)
    if (!regRes) {
      return
    }
    const [_, alias, commend] = regRes
    if (alias === "ALL") {
      let nodeMsg = []
      for (let index = 0; index < _config.servers.length; index++) {
        const element = _config.servers[index]
        let msgList = []
        msgList.push(segment.text(`${element.alias} 执行命令：${commend}\n`))
        const rcon = new rconClient(
          element.host,
          element.rconPort,
          element.password
        )
        try {
          const res = await rcon.send(commend)
          msgList.push(segment.text(`✅ 执行结果：${res}\n`))
        } catch (error) {
          msgList.push(segment.text(`❌ 执行失败\n`))
        }
        nodeMsg.push(
          segment.node(e.bot.account.selfId, e.bot.account.name, msgList)
        )
      }
      e.bot.sendMsg(e.contact, nodeMsg)
    } else {
      const findServer = _config.servers.find((item) => item.alias === alias)
      if (!findServer) {
        e.reply(
          "❌ 不存在该服务器，当前存在服务器" +
            _config.servers.map((item) => item.alias).join(","),
          { reply: true }
        )
        return
      }
      const rcon = new rconClient(
        findServer.host,
        findServer.rconPort,
        findServer.password
      )
      try {
        const res = await rcon.send(commend)
        e.reply(`✅ ${findServer.alias} 执行成功：${res}`, { reply: true })
      } catch (error) {
        e.reply(`❌ ${findServer.alias} 执行失败`, { reply: true })
      }
    }
    isSending = false
  }
})
//绑定 QQ 号与游戏昵称 #bind <nickName>
export const bind = karin.command(/^#bind (\S+)$/i, async (e) => {
  const _config = config()
  if (_config.banQQ.includes(e.sender.userId)) {
    e.reply("❌ 你被封禁了", { reply: true })
  }
  if (isWriteJSON) {
    e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
    return
  }
  const regRes = e.msg.match(/^#bind (\S+)$/i)
  if (!regRes) {
    return
  } else {
    const [_, nickName] = regRes
    const findNickname = _config.QQNoLinkMcNickname.find(
      (item) => item.mcNickname === nickName
    )
    if (findNickname) {
      e.reply(
        `❌ 该昵称已被绑定，请联系${segment.at(
          findNickname.qqNo
        )}使用 #unbind解绑`,
        {
          reply: true,
        }
      )
      return
    }
    const findQQ = _config.QQNoLinkMcNickname.find(
      (item) => item.qqNo === e.sender.userId
    )
    if (findQQ) {
      e.reply(`❌ 你已经绑定了昵称，请使用 #unbind 解绑后再绑定新的昵称`, {
        reply: true,
      })
      return
    }
    _config.QQNoLinkMcNickname.push({
      qqNo: e.sender.userId,
      mcNickname: nickName,
    })
    isWriteJSON = true
    writeJsonSync(`${dirConfig}/config.json`, _config)
    e.reply(`✅ 绑定成功，你的昵称为：${nickName}`, { reply: true })
    isWriteJSON = false
  }
})
//解绑游戏昵称 #unbind
export const unbind = karin.command(/^#unbind$/i, async (e) => {
  const _config = config()
  if (_config.banQQ.includes(e.sender.userId)) {
    e.reply("❌ 你被封禁了", { reply: true })
  }
  if (isWriteJSON) {
    e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
    return
  }
  const regRes = e.msg.match(/^#unbind$/i)
  if (!regRes) {
    return
  } else {
    const findQQ = _config.QQNoLinkMcNickname.find(
      (item) => item.qqNo === e.sender.userId
    )
    if (!findQQ) {
      e.reply(`❌ 你没有绑定昵称`, { reply: true })
      return
    }
    _config.QQNoLinkMcNickname = _config.QQNoLinkMcNickname.filter(
      (item) => item.qqNo !== e.sender.userId
    )
    isWriteJSON = true
    writeJsonSync(`${dirConfig}/config.json`, _config)
    e.reply(`✅ 解绑成功`, { reply: true })
    isWriteJSON = false
  }
})
// 群成员退群通知事件
// karin.accept('notice.groupMemberBan', (e) => {
//   //
// })
