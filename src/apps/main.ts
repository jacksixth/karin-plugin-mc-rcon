import { isValidHost, mcMotd } from "@/utils"
import karin, { segment } from "node-karin"

export const motd = karin.command(
  /^#?motd\s+([a-z0-9.-]+)(?::(\d+)|\s+(\d+))$/i,
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
    at: true,
    name: "mc-motd", // 插件名称
    log: true,
  }
)