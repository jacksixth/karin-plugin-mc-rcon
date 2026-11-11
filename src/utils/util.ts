import { isIP } from "net"
import lodash from "node-karin/lodash"
import moment from "node-karin/moment"

/**
 * 生成随机数
 * @param min - 最小值
 * @param max - 最大值
 * @returns
 */
export const random = (min: number, max: number) => lodash.random(min, max)

/**
 * 睡眠函数
 * @param ms - 毫秒
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 使用moment返回时间
 * @param format - 格式
 */
export const time = (format = "YYYY-MM-DD HH:mm:ss") => moment().format(format)

/**
 * 校验主机名格式，域名|ip
 */
export function isValidHost(host: string): boolean {
  // 基础格式检查
  if (!host || host.length > 253) return false

  // 优先检查IP地址格式
  if (isIP(host)) return true // 支持IPv4/IPv6

  // 分解域名标签进行校验
  const labels = host.split(".")
  const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i // 标签正则（不支持下划线）

  return labels.every(
    (label) =>
      domainRegex.test(label) && // 每个标签格式合法
      !label.startsWith(".") && // 防止连续点号
      !label.endsWith(".") // 结尾不能是点号
  )
}
/**
 * 取出首个参数，支持 <带空格的内容> 写法
 * @param str 命令参数部分
 * @returns [参数, 剩余内容]
 */
export function takeArg(str: string): [string, string] {
  const angle = str.match(/^<([^>]*)>\s*([\s\S]*)$/)
  if (angle) return [angle[1].trim(), angle[2]]
  const plain = str.match(/^(\S+)\s*([\s\S]*)$/)
  if (plain) return [plain[1], plain[2]]
  return ["", ""]
}

/**
 * 取冒号（中英文均可）后的内容，用于解析 list/whitelist 等命令返回值
 */
export function afterColon(text: string): string {
  const index = Math.max(text.indexOf(":"), text.indexOf("："))
  return index === -1 ? "" : text.slice(index + 1).trim()
}

/**
 * 校验端口号格式
 */
export function isValidPort(port: string): boolean {
  const num = parseInt(port, 10)
  return (
    !Number.isNaN(num) && num >= 1 && num <= 65535 && port === num.toString()
  )
}
