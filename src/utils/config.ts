import { dirPath, basename } from "./dir"
import { Config } from "config/config/config"
import {
  watch,
  logger,
  karinPathBase,
  filesByExt,
  copyConfigSync,
  requireFileSync,
  writeJsonSync,
} from "node-karin"

const dir = `${karinPathBase}/${basename}`
export const dirConfig = `${dir}/config`

const defDir = `${dirPath}/config`
const defConfig = `${defDir}/config`

/**
 * @description 初始化配置文件
 */
copyConfigSync(defConfig, dirConfig, [".json"])

/**
 * @description 配置文件
 */
export const config = (): Config => {
  const cfg = requireFileSync(`${dirConfig}/config.json`) as Config
  const def = requireFileSync(`${defConfig}/config.json`) as Config
  return { ...def, ...cfg }
}

/**
 * @description 保存配置并刷新读取缓存（requireFileSync 默认缓存 5 分钟）
 */
export const saveConfig = (cfg: Config) => {
  const file = `${dirConfig}/config.json`
  if (!writeJsonSync(file, cfg)) return false
  requireFileSync(file, { force: true })
  return true
}

/**
 * @description package.json
 */
export const pkg = () => requireFileSync(`${dirPath}/package.json`)

/**
 * @description 监听配置文件
 */
setTimeout(() => {
  const list = filesByExt(dirConfig, ".json", "abs")
  list.forEach((file) =>
    watch(file, () => {
      try {
        requireFileSync(file, { force: true })
        logger.info("配置文件已更新")
      } catch (error) {
        // 编辑器保存到一半时 JSON 可能不完整，保留旧缓存
        logger.error("配置文件解析失败，已保留旧配置:", error)
      }
    })
  )
}, 2000)
