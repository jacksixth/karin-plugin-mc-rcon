import { logger } from "node-karin"
import { Rcon } from "rcon-client"
const loggerPluginName = logger.chalk.hex("#90CAF9")(" ===== mc-rcon ===== ")

export class rconClient {
  client: Rcon
  private isSending = false // 发送标志
  constructor(host: string, port: string, password: string, timeout = 5000) {
    this.client = new Rcon({
      host,
      port: parseInt(port),
      password,
      timeout,
    })
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
      logger.info(
        loggerPluginName,
        "--- rcon --- ",
        `命令执行结果：${response}`
      )
      return response
    } catch (err) {
      // 转换错误类型保持接口稳定
      logger.error(
        loggerPluginName,
        "--- rcon --- ",
        `RCON 发送命令错误: ${err}`
      )
      throw new Error(`错误: ${err}`)
    } finally {
      // 无论成功失败都关闭连接
      if (this.client.authenticated) {
        await this.client.end()
        this.client.authenticated = false
      }
      this.isSending = false
      logger.info(loggerPluginName, "--- rcon --- ", "已关闭RCON连接")
    }
  }
}
