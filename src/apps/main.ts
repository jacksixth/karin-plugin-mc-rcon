import {
  afterColon,
  config,
  isValidHost,
  isValidPort,
  mcMotd,
  rconClient,
  saveConfig,
  takeArg,
  time,
} from "@/utils"
import karin, {
  segment,
  type Elements,
  type Message,
} from "node-karin"
/**
 * 群主/群管理员或机器人主人（qqbot 拿不到 QQ 号的 admin 列表，只能用群身份）
 */
const isOwner = (e: Message) => {
  const role = "role" in e.sender ? e.sender.role : undefined
  return role === "owner" || role === "admin" || e.isMaster
}
/**
 * 发送转发节点；qqbot 协议不支持转发节点，退化成一条普通文本+图片消息
 */
const sendForward = async (e: Message, msgs: Elements[][]) => {
  if (e.bot.adapter.protocol === "qqbot") {
    // qqbot 不支持转发节点，直接文本+图片发一条
    await e.bot.sendMsg(e.contact, msgs.flat())
    return
  }
  await e.bot.sendMsg(
    e.contact,
    msgs.map((list) =>
      segment.node(e.bot.account.selfId, e.bot.account.name, list)
    )
  )
}
//motd查询 #motd <host>:<port> | #motd <host> <port>
const motdReg = /^[#/]?motd\s+([\s\S]+)$/i
export const motd = karin.command(
  motdReg,
  async (e) => {
    const regRes = e.msg.match(motdReg)
    if (!regRes) return
    // 尖括号只是标记，去掉后按 host:port / host port 解析
    const m = regRes[1]
      .replace(/[<>]/g, "")
      .match(/^([a-z0-9.-]+)(?::(\d+)|\s+(\d+))$/i)
    if (!m) {
      return e.reply("❌ 用法：#motd <host> <port> 或 #motd <host:port>", {
        reply: true,
      })
    }
    const [, host, colonPort, spacePort] = m
    const port = colonPort || spacePort

    // 合法性校验
    if (!isValidHost(host)) {
      return e.reply("❌ 无效的主机名格式", { reply: true })
    }
    if (!isValidPort(port)) {
      return e.reply("❌ 端口号需在 1-65535 之间", { reply: true })
    }
    const data = await mcMotd(host, parseInt(port, 10)).catch(() => undefined)
    if (!data) {
      return e.reply("❌ 获取服务器状态失败，可能是服务器未开启。", {
        reply: true,
      })
    }
    const msgList: Elements[] = [
      segment.text(data.type + " " + data.version + "\n"),
    ]
    if (data.favicon) msgList.push(segment.image(data.favicon))
    msgList.push(
      segment.text(data.players.online + "/" + data.players.max + "\n")
    )
    if (data.description) msgList.push(segment.text(data.description + "\n"))
    e.bot.sendMsg(e.contact, msgList)
  },
  {
    name: "mc-rcon-motd", // 插件名称
    log: true,
  }
)
//列出所有服务器信息（伪造转发消息防刷屏） #server list
let isListing = false
export const listServer = karin.command(
  /^[#/]?(?:server list|服务器状态)$/i,
  async (e) => {
    const _config = config()
    if (isListing) {
      return e.reply("❌ 已经正在查询服务器详情了，请耐心等待", { reply: true })
    }
    if (_config.servers.length === 0) {
      return e.reply("❌ 服务器列表为空", { reply: true })
    }

    isListing = true
    try {
      const msgs: Elements[][] = []
      for (const element of _config.servers) {
        const msgList: Elements[] = []
        msgList.push(
          segment.text(`${element.alias} ${element.host}:${element.port}\n`)
        )
        try {
          const motd = await mcMotd(element.host, parseInt(element.port))
          if (motd) {
            if (motd.favicon) {
              // 图标紧跟别名/地址行
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
              //There are 2 of a max of 99 players online: xxx1, xxxx2
              const players = afterColon(await rcon.send("list"))
              if (players) {
                msgList.push(segment.text("在线玩家：" + players + "\n"))
              }
            } catch (error) {
              msgList.push(segment.text("获取在线玩家数据失败\n"))
            }
          } else {
            //没获取到或者报错会返回undefined
            msgList.push(
              segment.text("获取服务器信息失败，可能是服务器已关闭\n")
            )
          }
        } catch (error) {
          msgList.push(segment.text("获取服务器信息失败，可能是服务器已关闭\n"))
        }
        msgs.push(msgList)
      }
      await sendForward(e, msgs)
    } finally {
      isListing = false
    }
  },
  {
    name: "mc-rcon-listServer", // 插件名称
    log: true,
  }
)
// 向单个/所有服务器发送 RCON 命令（管理员专属） #rcon <serverAlias|ALL> <commend>
const rconReg = /^[#/](?:rcon|发送命令) ([\s\S]+)$/i
let isSending = false
export const rcon = karin.command(
  rconReg,
  async (e) => {
    if (!isOwner(e)) {
      return e.reply("❌ 你没有权限使用该命令（需要群主/管理员或机器人主人）", {
        reply: true,
      })
    }
    if (isSending) {
      return e.reply("❌ 已有命令正在执行，请等待当前命令完成", { reply: true })
    }
    const regRes = e.msg.match(rconReg)
    if (!regRes) return
    const _config = config()
    const [alias, rest] = takeArg(regRes[1])
    // 命令部分整体被尖括号包裹时去掉标记
    const commend = rest.replace(/^<([\s\S]*)>$/, "$1").trim()
    if (!alias || !commend) {
      return e.reply("❌ 用法：#rcon <serverAlias|ALL> <command>", { reply: true })
    }
    isSending = true
    try {
      if (alias === "ALL") {
        const msgs: Elements[][] = []
        for (const element of _config.servers) {
          const msgList: Elements[] = [
            segment.text(`${element.alias} 执行命令：${commend}\n`),
          ]
          const rcon = new rconClient(
            element.host,
            element.rconPort,
            element.password
          )
          try {
            msgList.push(
              segment.text(`✅ 执行结果：${await rcon.send(commend)}\n`)
            )
          } catch (error) {
            msgList.push(segment.text(`❌ 执行失败:${error}\n`))
          }
          msgs.push(msgList)
        }
        await sendForward(e, msgs)
        return
      }
      const findServer = _config.servers.find((item) => item.alias === alias)
      if (!findServer) {
        return e.reply(
          "❌ 不存在该服务器，当前存在服务器" +
            _config.servers.map((item) => item.alias).join(","),
          { reply: true }
        )
      }
      const rcon = new rconClient(
        findServer.host,
        findServer.rconPort,
        findServer.password
      )
      try {
        return e.reply(
          `✅ ${findServer.alias} 执行成功：${await rcon.send(commend)}`,
          { reply: true }
        )
      } catch (error) {
        return e.reply(`❌ ${findServer.alias} 执行失败:${error}`, {
          reply: true,
        })
      }
    } finally {
      isSending = false
    }
  },
  {
    name: "mc-rcon-rcon", // 插件名称
    log: true,
  }
)
//申请加入服务器白名单（需管理员审批） #apply <serverAlias> <mc昵称>
const applyReg = /^[#/](?:apply|申请) ([\s\S]+)$/i
export const apply = karin.command(
  applyReg,
  async (e) => {
    const _config = config()
    const regRes = e.msg.match(applyReg)
    if (!regRes) return
    const [alias, rest] = takeArg(regRes[1])
    const [nick] = takeArg(rest)
    if (!alias || !nick) {
      return e.reply("❌ 用法：#apply <serverAlias> <mc昵称>", { reply: true })
    }
    const server = _config.servers.find((item) => item.alias === alias)
    if (!server) {
      return e.reply(
        "❌ 不存在该服务器，当前存在服务器：" +
          _config.servers.map((item) => item.alias).join(","),
        { reply: true }
      )
    }
    if (
      _config.requests.some(
        (item) => item.alias === alias && item.nick === nick
      )
    ) {
      return e.reply("❌ 该昵称已提交过申请，等待管理员审批", { reply: true })
    }
    _config.requests.push({
      id: e.sender.userId,
      nick,
      alias,
      time: time(),
    })
    saveConfig(_config)
    return e.reply("✅ 已提交白名单申请，等待管理员审批", { reply: true })
  },
  {
    name: "mc-rcon-apply", // 插件名称
    log: true,
  }
)
//白名单申请列表（群主/群管理员或机器人主人） #req
const reqReg = /^[#/](?:req|申请列表)$/i
export const reqList = karin.command(
  reqReg,
  async (e) => {
    if (!isOwner(e)) {
      return e.reply("❌ 你没有权限使用该命令（需要群主/管理员或机器人主人）", {
        reply: true,
      })
    }
    const _config = config()
    if (_config.requests.length === 0) {
      return e.reply("✅ 当前没有待审批的白名单申请", { reply: true })
    }
    const list = _config.requests
      .map(
        (item, index) =>
          `${index + 1}. ${item.nick} @ ${item.alias}（${item.time}）`
      )
      .join("\n")
    return e.reply(
      `待审批白名单申请：\n${list}\n#ok <序号> 通过，#no <序号> 拒绝`,
      { reply: true }
    )
  },
  {
    name: "mc-rcon-req", // 插件名称
    log: true,
  }
)
//通过白名单申请（群主/群管理员或机器人主人） #ok <序号>
const okReg = /^[#/](?:ok|通过) ([\s\S]+)$/i
export const approve = karin.command(
  okReg,
  async (e) => {
    if (!isOwner(e)) {
      return e.reply("❌ 你没有权限使用该命令（需要群主/管理员或机器人主人）", {
        reply: true,
      })
    }
    const _config = config()
    const regRes = e.msg.match(okReg)
    if (!regRes) return
    const [num] = takeArg(regRes[1])
    const index = Number(num) - 1
    const item = _config.requests[index]
    if (!item) {
      return e.reply("❌ 序号不存在，请先发送 #req 查看申请列表", { reply: true })
    }
    const server = _config.servers.find((s) => s.alias === item.alias)
    if (!server) {
      _config.requests.splice(index, 1)
      saveConfig(_config)
      return e.reply("❌ 对应服务器已被删除，申请已移除", { reply: true })
    }
    const rcon = new rconClient(
      server.host,
      server.rconPort,
      server.password
    )
    try {
      const res = await rcon.send(`whitelist add ${item.nick}`)
      _config.requests.splice(index, 1)
      saveConfig(_config)
      return e.reply(`✅ 已通过 ${item.nick} 的申请：${res}`, { reply: true })
    } catch (error) {
      // 失败时保留申请，方便重试
      return e.reply(`❌ 通过失败：${error}`, { reply: true })
    }
  },
  {
    name: "mc-rcon-ok", // 插件名称
    log: true,
  }
)
//拒绝白名单申请（群主/群管理员或机器人主人） #no <序号>
const noReg = /^[#/](?:no|拒绝) ([\s\S]+)$/i
export const reject = karin.command(
  noReg,
  async (e) => {
    if (!isOwner(e)) {
      return e.reply("❌ 你没有权限使用该命令（需要群主/管理员或机器人主人）", {
        reply: true,
      })
    }
    const _config = config()
    const regRes = e.msg.match(noReg)
    if (!regRes) return
    const [num] = takeArg(regRes[1])
    const index = Number(num) - 1
    const item = _config.requests[index]
    if (!item) {
      return e.reply("❌ 序号不存在，请先发送 #req 查看申请列表", { reply: true })
    }
    _config.requests.splice(index, 1)
    saveConfig(_config)
    return e.reply(`✅ 已拒绝 ${item.nick} 的申请`, { reply: true })
  },
  {
    name: "mc-rcon-no", // 插件名称
    log: true,
  }
)
//查看/移除服务器白名单（群主/群管理员或机器人主人） #wl <serverAlias> [del <昵称>]
const wlReg = /^[#/](?:wl|白名单) ([\s\S]+)$/i
export const wl = karin.command(
  wlReg,
  async (e) => {
    if (!isOwner(e)) {
      return e.reply("❌ 你没有权限使用该命令（需要群主/管理员或机器人主人）", {
        reply: true,
      })
    }
    const _config = config()
    const regRes = e.msg.match(wlReg)
    if (!regRes) return
    const [alias, rest] = takeArg(regRes[1])
    // 可选 del <昵称>
    const delMatch = rest.match(/^(?:del|删除|移除)\s+([\s\S]+)$/i)
    const del = delMatch ? takeArg(delMatch[1])[0] : ""
    const server = _config.servers.find((item) => item.alias === alias)
    if (!server) {
      return e.reply(
        "❌ 不存在该服务器，当前存在服务器：" +
          _config.servers.map((item) => item.alias).join(","),
        { reply: true }
      )
    }
    const rcon = new rconClient(
      server.host,
      server.rconPort,
      server.password
    )
    try {
      if (del) {
        const res = await rcon.send(`whitelist remove ${del}`)
        return e.reply(`✅ 已移出白名单：${res}`, { reply: true })
      }
      const names = afterColon(await rcon.send("whitelist list"))
      return e.reply(
        `✅ ${server.alias} 白名单：${names || "空"}`,
        { reply: true }
      )
    } catch (error) {
      return e.reply(`❌ 操作失败：${error}`, { reply: true })
    }
  },
  {
    name: "mc-rcon-wl", // 插件名称
    log: true,
  }
)
//命令列表
// 查看命令帮助 #help
export const help = karin.command(
  /^[#/](?:help|帮助)$/i,
  async (e) => {
    const helpList = [
      {
        cmd: "#motd <host> <port>",
        desc: "查询Minecraft服务器状态（支持Java/基岩版，也支持 <host:port>）",
      },
      {
        cmd: "#(server list|服务器状态)",
        desc: "列出所有服务器信息（含在线玩家）",
      },
      {
        cmd: "#(rcon|发送命令) <serverAlias|ALL> <command>",
        desc: "发送RCON命令（群主/群管理员或机器人主人）",
      },
      {
        cmd: "#(apply|申请) <serverAlias> <mc昵称>",
        desc: "申请加入服务器白名单（需管理员审批）",
      },
      {
        cmd: "#(req|申请列表)",
        desc: "查看待审批的白名单申请（群主/群管理员或机器人主人）",
      },
      {
        cmd: "#(ok|通过) <序号> / #(no|拒绝) <序号>",
        desc: "通过/拒绝白名单申请（群主/群管理员或机器人主人）",
      },
      {
        cmd: "#(wl|白名单) <serverAlias> [del <昵称>]",
        desc: "查看/移除服务器白名单（群主/群管理员或机器人主人）",
      },
    ]

    let msg = ["❄️ Minecraft 服务器管理插件命令列表 ❄️\n"]
    msg.push("================================")

    helpList.forEach((item, index) => {
      msg.push(`${index + 1}. ${item.cmd}`)
      msg.push(`   ➤ ${item.desc}\n`)
    })

    msg.push("================================")
    msg.push("提示：<> 为必填参数（可不输入尖括号），# 和 / 均可作前缀")
    msg.push("提示：参数含空格时请用尖括号包裹，如 #apply <生存服 A> Steve")
    msg.push("#rcon 需要群主/群管理员或机器人主人权限")

    await sendForward(e, [[segment.text(msg.join("\n"))]])
  },
  {
    name: "mc-rcon-help",
    log: true,
  }
)
