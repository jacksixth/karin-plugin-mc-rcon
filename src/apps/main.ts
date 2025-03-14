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
    name: "mc-rcon-motd", // 插件名称
    log: true,
  }
)
// 添加服务器 #server add <host> <port> <rconPort> <password> <serverAlias>
export const addServer = karin.command(
  /^#(?:server add|添加服务器) (\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/i,
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
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const regRes = e.msg.match(
      /^#(?:server add|添加服务器) (\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/i
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
    name: "mc-rcon-addServer", // 插件名称
    log: true,
  }
)
// 删除服务器 #server remove <serverAlias>
export const removeServer = karin.command(
  /^#(?:server remove|删除服务器) (\S+)$/i,
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
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:server remove|删除服务器) (\S+)$/i)
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
    name: "mc-rcon-removeServer", // 插件名称
    log: true,
  }
)
//列出所有服务器信息（伪造转发消息防刷屏） #server list
let isListing = false
export const listServer = karin.command(
  /^#(?:server list|服务器状态)$/i,
  async (e) => {
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
  },
  {
    name: "mc-rcon-listServer", // 插件名称
    log: true,
  }
)
//查看单个服务器详情 #server info <serverAlias>
export const serverInfo = karin.command(
  /^#(?:server info|服务器信息) (\S+)$/i,
  async (e) => {
    const _config = config()
    if (_config.banQQ.includes(e.sender.userId)) {
      e.reply("❌ 你被封禁了", { reply: true })
    }
    if (isListing) {
      e.reply("❌ 已经正在查询服务器详情了，请耐心等待", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:server info|服务器信息) (\S+)$/i)
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
  },
  {
    name: "mc-rcon-infoServer", // 插件名称
    log: true,
  }
)
// 开启服务器白名单（管理员专属） `#server wlon <serverAlias>`
export const wlon = karin.command(
  /^#(?:server wlon|开启白名单) (\S+)$/i,
  async (e) => {
    const _config = config()
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:server wlon|开启白名单) (\S+)$/i)
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
      const res = await rcon.send("whitelist on")
      e.reply("✅ 服务器白名单已开启,命令返回：" + res, { reply: true })
    } catch (error) {
      e.reply("❌ 服务器白名单开启失败,命令返回：" + error, { reply: true })
    }
  },
  {
    name: "mc-rcon-wlon", // 插件名称
    log: true,
  }
)
// 关闭服务器白名单（管理员专属） `#server wloff <serverAlias>`
export const wloff = karin.command(
  /^#(?:server wloff|关闭白名单) (\S+)$/i,
  async (e) => {
    const _config = config()
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:server wloff|关闭白名单) (\S+)$/i)
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
      const res = await rcon.send("whitelist off")
      e.reply("✅ 服务器白名单已关闭,命令返回：" + res, { reply: true })
    } catch (error) {
      e.reply("❌ 服务器白名单关闭失败,命令返回：" + error, { reply: true })
    }
  },
  {
    name: "mc-rcon-wloff", // 插件名称
    log: true,
  }
)
// 查看服务器白名单（管理员专属） `#server wllist <serverAlias>`
export const wllist = karin.command(
  /^#(?:server wllist|白名单列表) (\S+)$/i,
  async (e) => {
    const _config = config()
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:server wllist|白名单列表) (\S+)$/i)
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
      e.reply("❌ 查看服务器白名单失败,命令返回：" + error, { reply: true })
    }
  },
  {
    name: "mc-rcon-wllist", // 插件名称
    log: true,
  }
)
// 向单个/所有服务器发送 RCON 命令（管理员专属） #rcon <serverAlias|ALL> <commend>
let isSending = false
export const rcon = karin.command(
  /^#(?:rcon|发送命令) (\S+) (.+)$/i,
  async (e) => {
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    } else {
      if (isSending) {
        e.reply("❌ 已有命令正在执行，请等待当前命令完成", { reply: true })
        return
      }
      isSending = true
      const _config = config()
      const regRes = e.msg.match(/^#(?:rcon|发送命令) (\S+) (.+)$/i)
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
            msgList.push(segment.text(`❌ 执行失败:${error}\n`))
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
          e.reply(`❌ ${findServer.alias} 执行失败:${error}`, { reply: true })
        }
      }
      isSending = false
    }
  },
  {
    name: "mc-rcon-rcon", // 插件名称
    log: true,
  }
)
//绑定 QQ 号与游戏昵称 #bind <nickName>
export const bind = karin.command(
  /^#(?:bind|绑定|注册) (\S+)$/i,
  async (e) => {
    const _config = config()
    if (_config.banQQ.includes(e.sender.userId)) {
      e.reply("❌ 你被封禁了", { reply: true })
    }
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:bind|绑定|注册) (\S+)$/i)
    if (!regRes) {
      return
    } else {
      const [_, nickName] = regRes
      const findQQ = _config.QQNoLinkMcNickname.find(
        (item) => item.qqNo === e.sender.userId
      )
      if (findQQ) {
        e.reply(`❌ 你已经绑定了昵称，请使用 #unbind 解绑后再绑定新的昵称`, {
          reply: true,
        })
        return
      }
      const findNickname = _config.QQNoLinkMcNickname.find(
        (item) => item.mcNickname === nickName
      )
      if (findNickname) {
        try {
          // 群聊中该qq号已不在群聊中，无法at 会报错 需要管理员解绑
          await e.reply(
            [
              segment.text("❌ 该昵称已被绑定，请联系 "),
              segment.at(findNickname.qqNo),
              segment.text(" 使用 #unbind 解绑"),
            ],
            {
              reply: true,
            }
          )
        } catch (error) {
          e.reply(
            `❌ 该昵称已被绑定且主人已不在群聊中，请联系管理员使用 #unbind <${findNickname.qqNo}> 解绑`,
            {
              reply: true,
            }
          )
        }

        return
      }
      _config.QQNoLinkMcNickname.push({
        qqNo: e.sender.userId,
        qqNickname: e.sender.name,
        mcNickname: nickName,
      })
      isWriteJSON = true
      writeJsonSync(`${dirConfig}/config.json`, _config)
      e.reply(`✅ 绑定成功，你的昵称为：${nickName}`, { reply: true })
      isWriteJSON = false
    }
  },
  {
    name: "mc-rcon-bind", // 插件名称
    log: true,
  }
)
//解绑游戏昵称 #unbind
export const unbind = karin.command(
  /^#(?:unbind|解绑|注销)$/i,
  async (e) => {
    const _config = config()
    if (_config.banQQ.includes(e.sender.userId)) {
      e.reply("❌ 你被封禁了", { reply: true })
    }
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:unbind|解绑|注销)$/i)
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
  },
  {
    name: "mc-rcon-unbind", // 插件名称
    log: true,
  }
)
//管理员解绑游戏昵称 #unbind <QQ号>
export const unbindAdmin = karin.command(
  /^#(?:unbind|解绑|注销) (\d+)$/i,
  async (e) => {
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const _config = config()
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:unbind|解绑) (\d+)$/i)
    if (!regRes) {
      return
    } else {
      const [_, qqNo] = regRes
      const findQQ = _config.QQNoLinkMcNickname.find(
        (item) => item.qqNo === qqNo
      )
      if (!findQQ) {
        e.reply(`❌ 该QQ号没有绑定昵称`, { reply: true })
        return
      }
      _config.QQNoLinkMcNickname = _config.QQNoLinkMcNickname.filter(
        (item) => item.qqNo !== qqNo
      )
      isWriteJSON = true
      writeJsonSync(`${dirConfig}/config.json`, _config)
      e.reply(`✅ 解绑成功`, { reply: true })
      isWriteJSON = false
    }
  },
  {
    name: "mc-rcon-unbindAdmin", // 插件名称
    log: true,
  }
)
//封禁玩家（无法使用机器人功能并且将其绑定昵称在所有服务器中ban了）（管理员专属） #ban <QQ号>
export const ban = karin.command(
  /^#(?:ban|封禁) (\d+)$/i,
  async (e) => {
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const _config = config()
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:ban|封禁) (\d+)$/i)
    if (!regRes) {
      return
    }
    const [_, qqNo] = regRes
    if (_config.banQQ.includes(qqNo)) {
      e.reply(`❌ 该QQ号已被封禁`, { reply: true })
      return
    }
    const msgList = []
    //获取绑定的昵称
    const findQQ = _config.QQNoLinkMcNickname.find((item) => item.qqNo === qqNo)
    //将绑定的昵称加入所有服务器黑名单
    if (findQQ) {
      for (let index = 0; index < _config.servers.length; index++) {
        const element = _config.servers[index]
        const rcon = new rconClient(
          element.host,
          element.rconPort,
          element.password
        )
        try {
          const res = await rcon.send(`ban ${findQQ.mcNickname}`)
          msgList.push(
            segment.text(
              `✅ ${element.alias}服务器已ban${findQQ.mcNickname}\n命令返回：${res}\n`
            )
          )
        } catch (error) {
          //忽略错误
          msgList.push(
            segment.text(`❌ ${element.alias}服务器ban命令执行失败:${error}\n`)
          )
        }
      }
    } else {
      msgList.push(segment.text(`❌ 该QQ号未绑定昵称\n`))
    }
    //加入封禁列表
    _config.banQQ.push(qqNo)
    isWriteJSON = true
    writeJsonSync(`${dirConfig}/config.json`, _config)
    msgList.push(segment.text(`✅ 封禁成功\n`))
    e.reply(msgList, { reply: true })
    isWriteJSON = false
  },
  {
    name: "mc-rcon-ban", // 插件名称
    log: true,
  }
)
//解封玩家（解封后可以使用机器人功能）（管理员专属） #unban <QQ号>
export const unban = karin.command(
  /^#(?:unban|解封) (\d+)$/i,
  async (e) => {
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const _config = config()
    if (isWriteJSON) {
      e.reply("❌ 其他命令正在修改文件，请稍后再试", { reply: true })
    }
    const regRes = e.msg.match(/^#(?:unban|解禁) (\d+)$/i)
    if (!regRes) {
      return
    }
    const [_, qqNo] = regRes
    if (!_config.banQQ.includes(qqNo)) {
      e.reply(`❌ 该QQ号未被封禁`, { reply: true })
      return
    }
    //解封
    const msgList = []
    _config.banQQ = _config.banQQ.filter((item) => item !== qqNo)
    //在所有服务器中解ban
    //获取绑定的昵称
    const findQQ = _config.QQNoLinkMcNickname.find((item) => item.qqNo === qqNo)
    if (findQQ) {
      for (let index = 0; index < _config.servers.length; index++) {
        const element = _config.servers[index]
        const rcon = new rconClient(
          element.host,
          element.rconPort,
          element.password
        )
        try {
          const res = await rcon.send(`pardon ${findQQ.mcNickname}`)
          msgList.push(
            segment.text(
              `✅ ${element.alias}服务器已解ban${findQQ.mcNickname}\n命令返回：${res}\n`
            )
          )
        } catch (error) {
          msgList.push(
            segment.text(
              `❌ ${element.alias}服务器解ban命令执行失败:${error}\n`
            )
          )
        }
      }
    } else {
      msgList.push(segment.text(`❌ 该QQ号未绑定昵称\n`))
    }
    isWriteJSON = true
    writeJsonSync(`${dirConfig}/config.json`, _config)
    msgList.push(segment.text(`✅ 解封成功\n`))
    e.reply(msgList, { reply: true })
    isWriteJSON = false
  },
  {
    name: "mc-rcon-unban", // 插件名称
    log: true,
  }
)
//申请白名单 #apply <serverAlias>
export const apply = karin.command(
  /^#(?:apply|申请) (\S+)$/i,
  async (e) => {
    const _config = config()
    if (_config.banQQ.includes(e.sender.userId)) {
      e.reply("❌ 你被封禁了", { reply: true })
    }
    //获取服务器信息
    const regRes = e.msg.match(/^#(?:apply|申请白名单) (\S+)$/i)
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
    //获取绑定的昵称
    const findQQ = _config.QQNoLinkMcNickname.find(
      (item) => item.qqNo === e.sender.userId
    )
    if (!findQQ) {
      e.reply("❌ 你未绑定昵称，请使用 #bind|注册|绑定 <nickname> 命令绑定", {
        reply: true,
      })
      return
    }
    const rcon = new rconClient(
      findServer.host,
      findServer.rconPort,
      findServer.password
    )
    try {
      const res = await rcon.send(`whitelist add ${findQQ.mcNickname}`)
      e.reply(`✅ 申请白名单成功,命令返回:${res}`, { reply: true })
      return
    } catch (error) {
      e.reply(`❌ 白名单申请失败,命令返回:${error}`, { reply: true })
    }
  },
  {
    name: "mc-rcon-apply", // 插件名称
    log: true,
  }
)
//取消白名单 #revoke <QQNo> <serverAlias>
export const revoke = karin.command(
  /^#(?:revoke|取消白名单)\s+(\d+)\s+(\S+)$/,
  async (e) => {
    if (!e.isMaster && !e.isAdmin) {
      e.reply("❌ 你没有权限使用该命令", { reply: true })
      return
    }
    const regRes = e.msg.match(/^#(?:revoke|取消白名单)\s+(\d+)\s+(\S+)$/i)
    const _config = config()
    if (!regRes) {
      return
    }
    const [_, qqNo, alias] = regRes
    const server = _config.servers.find((server) => server.alias === alias)
    if (!server) {
      e.reply(
        "❌ 不存在该服务器,当前存在服务器：" +
          _config.servers.map((item) => item.alias).join(","),
        { reply: true }
      )
      return
    }
    const rcon = new rconClient(server.host, server.rconPort, server.password)
    try {
      const res = await rcon.send(`whitelist remove ${qqNo}`)
      e.reply(`✅ 取消白名单成功,命令返回${res}`, { reply: true })
    } catch (error) {
      e.reply(`❌ 取消白名单失败,命令返回${error}`, { reply: true })
    }
  },
  {
    name: "mc-rcon-revoke", // 插件名称
    log: true,
  }
)

// 群成员退群通知事件
export const groupMemberBanNotice = karin.accept(
  "notice.groupMemberBan",
  async (e) => {
    //退群 清除绑定 在各服务器中ban掉
    const _config = config()
    if (isWriteJSON) {
      e.bot.sendMsg(e.contact, [
        segment.text("❌ 其他命令正在修改文件，请稍后再试"),
      ])
      return
    }
    const msgList = []
    msgList.push(segment.text(`QQ号${e.userId}离开了我们\n`))
    const findNickname = _config.QQNoLinkMcNickname.find(
      (item) => item.qqNo == e.userId
    )
    if (!findNickname) {
      msgList.push(segment.text("该QQ号未绑定昵称\n"))
      return
    }
    for (let index = 0; index < _config.servers.length; index++) {
      const element = _config.servers[index]
      const rcon = new rconClient(
        element.host,
        element.rconPort,
        element.password
      )
      try {
        const res = await rcon.send(`ban ${findNickname.mcNickname}`)
        msgList.push(
          segment.text(
            `✅ ${element.alias}服务器已ban${findNickname.mcNickname}\n命令返回：${res}\n`
          )
        )
      } catch (error) {
        msgList.push(
          segment.text(`❌ ${element.alias}服务器ban命令执行失败:${error}\n`)
        )
      }
    }
    e.bot.sendMsg(e.contact, msgList)
  },
  {
    name: "mc-rcon-groupMemberBanNotice", // 插件名称
    log: true,
  }
)
//入群欢迎
export const groupMemberAddNotice = karin.accept(
  "notice.groupMemberAdd",
  async (e) => {
    //加群
    e.bot.sendMsg(e.contact, [
      segment.at(e.userId),
      segment.text(" 欢迎加入本群，发言前请先阅读群公告"),
    ])
    //查看是否有绑定
    const _config = config()
    const findQQ = _config.QQNoLinkMcNickname.find(
      (item) => item.qqNo === e.userId
    )
    if (findQQ) {
      e.bot.sendMsg(e.contact, [
        segment.at(e.userId),
        segment.text(
          `你已经绑定了昵称：${findQQ.mcNickname}，如无法加入服务器请联系管理员解除服务器黑名单`
        ),
      ])
    }
  },
  {
    name: "mc-rcon-groupMemberAddNotice", // 插件名称
    log: true,
  }
)
//命令列表
// 查看命令帮助 #voidhelp
export const voidhelp = karin.command(
  /^#(?:voidhelp|void帮助)$/i,
  async (e) => {
    const helpList = [
      {
        cmd: "#motd <host>:<port>",
        desc: "查询Minecraft服务器状态（支持Java/基岩版）",
      },
      {
        cmd: "#(server add|添加服务器) <host> <port> <rconPort> <password> <serverAlias>",
        desc: "添加服务器（需管理员私聊操作）",
      },
      {
        cmd: "#(server remove|删除服务器) <serverAlias>",
        desc: "删除服务器（需管理员私聊操作）",
      },
      {
        cmd: "#(server list|服务器列表)",
        desc: "列出所有服务器信息（含在线玩家）",
      },
      {
        cmd: "#(server info|服务器信息) <serverAlias>",
        desc: "查看单个服务器详情",
      },
      {
        cmd: "#(server wlon|开启白名单) <serverAlias>",
        desc: "开启服务器白名单（管理员专属）",
      },
      {
        cmd: "#(server wloff|关闭白名单) <serverAlias>",
        desc: "关闭服务器白名单（管理员专属）",
      },
      {
        cmd: "#(server wllist|白名单列表) <serverAlias>",
        desc: "查看服务器白名单（管理员专属）",
      },
      {
        cmd: "#(rcon|发送命令) <serverAlias|ALL> <command>",
        desc: "发送RCON命令（管理员专属）",
      },
      {
        cmd: "#(bind|绑定|注册) <昵称>",
        desc: "绑定QQ与游戏昵称",
      },
      {
        cmd: "#(unbind|解绑|注销)",
        desc: "解绑游戏昵称",
      },
      {
        cmd: "#(ban|封禁) <QQ号>",
        desc: "封禁玩家（管理员专属）",
      },
      {
        cmd: "#(unban|解禁) <QQ号>",
        desc: "解封玩家（管理员专属）",
      },
      {
        cmd: "#(apply|申请) <serverAlias>",
        desc: "申请加入服务器白名单",
      },
      {
        cmd: "#(revoke|取消白名单) <QQ号> <serverAlias>",
        desc: "撤销白名单权限（管理员专属）",
      },
    ]

    let msg = ["❄️ Minecraft 服务器管理插件命令列表 ❄️\n"]
    msg.push("================================")

    helpList.forEach((item, index) => {
      msg.push(`${index + 1}. ${item.cmd}`)
      msg.push(`   ➤ ${item.desc}\n`)
    })

    msg.push("================================")
    msg.push("提示：带<>的为须填参数，且无需输入符号<>")
    msg.push("管理命令需要管理员/主人权限")

    e.bot.sendMsg(e.contact, [
      segment.node(e.bot.account.selfId, e.bot.account.name, [
        segment.text(msg.join("\n")),
      ]),
    ])
  },
  {
    name: "mc-rcon-voidhelp",
    log: true,
  }
)
