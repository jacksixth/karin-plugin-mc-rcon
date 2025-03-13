import { config, dirConfig, isValidHost, isValidPort, mcMotd } from "@/utils"
import karin, { segment, writeJsonSync } from "node-karin"

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
        port: parseInt(port),
        rconPort: parseInt(rconPort),
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
        e.reply("❌ 不存在该服务器")
        return
      } else {
        _config.servers = _config.servers.filter((item) => item.alias !== alias)
        writeJsonSync(`${dirConfig}/config.json`, _config)
        e.reply("✅ 服务器删除成功")
      }
    }
  },
  {
    name: "mc-remove-server", // 插件名称
    log: true,
  }
)
// 群成员退群通知事件
// karin.accept('notice.groupMemberBan', (e) => {
//   //
// })
