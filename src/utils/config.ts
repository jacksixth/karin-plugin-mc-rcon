import { dirPath, basename } from "@/utils"
import { Config } from "config/config/config"
import {
  watch,
  logger,
  karinPathBase,
  filesByExt,
  copyConfigSync,
  requireFileSync,
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
 * @description package.json
 */
export const pkg = () => requireFileSync(`${dirPath}/package.json`)

/**
 * @description 监听配置文件
 */
setTimeout(() => {
  const list = filesByExt(dirConfig, ".json", "abs")
  list.forEach((file) =>
    watch(file, (old, now) => {
      logger.info("旧数据:", old)
      logger.info("新数据:", now)
    })
  )
}, 2000)
