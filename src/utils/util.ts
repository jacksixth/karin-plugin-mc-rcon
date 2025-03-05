import { isIP } from 'net'
import lodash from 'node-karin/lodash'
import moment from 'node-karin/moment'

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
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 使用moment返回时间
 * @param format - 格式
 */
export const time = (format = 'YYYY-MM-DD HH:mm:ss') => moment().format(format)

/**
 * 
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
