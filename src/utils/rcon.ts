import { logger } from "node-karin"
import { Rcon } from "rcon-client"
const loggerPluginName = logger.chalk.hex("#90CAF9")(" ===== mc-rcon ===== ")

export class rconClient {
  client: Rcon
  private isSending = false // 发送标志
  constructor(host: string, port: number, password: string) {
    this.client = new Rcon({ host, port, password, timeout: 5000 })
    this.client.on("end", () => {
      this.client.authenticated = false
    })
    this.client.on("error", (err) => {
      logger.error(loggerPluginName, "--- rcon --- ", `RCON 连接出错: ${err}`)
    })
  }
  /**
   * 发送RCON命令到服务器
   * @param command 要执行的RCON命令
   * @returns 命令执行结果的Promise
   */
  async send(command: string): Promise<string> {
    if (this.isSending) {
      throw new Error("已有命令正在执行，请等待当前命令完成")
    }
    this.isSending = true
    try {
      // 确保连接已建立
      if (!this.client.authenticated) {
        await this.client.connect()
      }
      logger.info(loggerPluginName, "--- rcon --- ", `正在发送命令：${command}`)
      // 发送命令并等待响应
      const response = await this.client.send(command)
      return response
    } catch (err) {
      // 转换错误类型保持接口稳定
      throw new Error(`RCON 发送命令错误: ${err}`)
    } finally {
      // 无论成功失败都关闭连接
      if (this.client.authenticated) {
        await this.client.end()
        this.client.authenticated = false
      }
      this.isSending = false
    }
  }
}

export class RconManager {
  private connections: Map<string, rconClient>

  /**
   * 创建RCON连接管理器
   * @param servers 服务器配置数组，格式为 { host: string, port: number, password: string }
   */
  constructor(
    servers: Array<{ host: string; port: number; password: string }>
  ) {
    this.connections = new Map()

    // 为每个服务器创建并缓存连接
    servers.forEach((server) => {
      const key = `${server.host}:${server.port}`
      const client = new rconClient(server.host, server.port, server.password)
      this.connections.set(key, client)
    })
  }

  /**
   * 向指定服务器发送RCON命令
   * @param serverKey 服务器唯一标识（格式： host:port ）
   * @param command 要执行的RCON命令
   * @returns 命令执行结果Promise
   */
  async sendToServer(serverKey: string, command: string): Promise<string> {
    const client = this.connections.get(serverKey)
    if (!client) throw new Error("未找到服务器")
    try {
      return await client.send(command)
    } catch (error) {
      throw new Error(`${error}`)
    }
  }

}
