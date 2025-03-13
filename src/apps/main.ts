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

//motd查询
export const motd = karin.command(
  /^#motd\s+([a-z0-9.-]+)(?::(\d+)|\s+(\d+))$/i,
  async (e) => {
    const regRes = e.msg.match(/^#?motd\s+([a-z0-9.-]+)(?::(\d+)|\s+(\d+))$/i)
    if (!regRes) {
      //不可能会走到这里
      return
    } else {
      const host = regRes[1]
      const port = regRes[2] || regRes[3]
      // 添加端口默认值处理
      const defaultPort = 25565
      const parsedPort = port ? parseInt(port) : defaultPort

      // 合法性校验
      if (!isValidHost(host)) {
        e.reply("❌ 无效的主机名格式")
        return
      }
      if (parsedPort < 1 || parsedPort > 65535) {
        e.reply("❌ 端口号需在 1-65535 之间")
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
        e.reply("❌ 获取服务器状态失败，可能是服务器未开启。")
      }
    }
  },
  {
    name: "mc-motd", // 插件名称
    log: true,
  }
)
// 添加服务器
export const addServer = karin.command(
  /^#server add (\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$/i,
  async (e) => {
    if (e.contact.scene != "friend" && e.contact.scene != "groupTemp") {
      e.reply("❌ 请在私聊中添加服务器")
      return
    }
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限添加服务器")
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
        e.reply("❌ 无效的host格式")
        return
      }
      if (!isValidPort(port) || !isValidPort(rconPort)) {
        e.reply("❌ 无效的端口号格式")
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
      writeJsonSync(`${dirConfig}/config.json`, _config)
      e.reply("✅ 服务器添加成功")
    }
  },
  {
    name: "mc-add-server", // 插件名称
    log: true,
  }
)
// 删除服务器
export const removeServer = karin.command(
  /^#server remove (\S+)$/i,
  async (e) => {
    if (e.contact.scene != "friend" && e.contact.scene != "groupTemp") {
      e.reply("❌ 请在私聊中添加服务器")
      return
    }
    if (!e.isAdmin && !e.isMaster) {
      e.reply("❌ 你没有权限删除服务器")
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
            _config.servers.map((item) => item.alias).join(",")
        )
        return
      } else {
        _config.servers = _config.servers.filter((item) => item.alias !== alias)
        writeJsonSync(`${dirConfig}/config.json`, _config)
        e.reply(
          "✅ 服务器删除成功,当前存在服务器：" +
            _config.servers.map((item) => item.alias).join(",")
        )
      }
    }
  },
  {
    name: "mc-remove-server", // 插件名称
    log: true,
  }
)
//列出所有服务器信息（伪造转发消息防刷屏）
export const listServer = karin.command(/^#server list$/i, async (e) => {
  const _config = config()
  if (_config.servers.length === 0) {
    e.reply("❌ 服务器列表为空")
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
})
//查看单个服务器详情 #server info <serverAlias>
export const serverInfo = karin.command(/^#server info (\S+)$/i, async (e) => {
  const _config = config()
  const regRes = e.msg.match(/^#server info (\S+)$/i)
  if (!regRes) {
    //不可能会走到这里
    return
  } else {
    const [_, alias] = regRes
    const findServer = _config.servers.find((item) => item.alias === alias)
    if (!findServer) {
      e.reply(
        "❌ 不存在该服务器，当前存在服务器" +
          _config.servers.map((item) => item.alias).join(",")
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
    e.reply(msgList)
  }
})

// 群成员退群通知事件
// karin.accept('notice.groupMemberBan', (e) => {
//   //
// })
