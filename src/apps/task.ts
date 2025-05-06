import { config } from "@/utils"
import { karin, logger } from "node-karin"

/**
 * 定时任务模板
 * 参数1: 任务名称
 * 参数2: cron表达式
 * 参数3: 任务方法
 */
// export const Task = karin.task('1分钟打印1次hello', '0 */1 * * * *', () => {
//   logger.info('hello')
// }, { log: false })
//定时任务-半小时一次-保存服务器内正在游玩的玩家名至数据库
// export const savePlayerNameTask = karin.task(
//   "保存服务器内正在游玩的玩家名至数据库",
//   "0 0/30 * * * *",
//   () => {
//     const _config = config()
//     const serverList = _config.servers
//     if (serverList.length === 0) {
//       logger.info("没有服务器，跳过保存玩家名至数据库")
//       return
//     }

//   }
// )
