import { karinPathBase } from "node-karin"
import sqlite3 from "node-karin/sqlite3"
import { basename } from "./dir"
import fs from "fs"
const dir = `${karinPathBase}/${basename}`
const dbPath = `${dir}/data/jack-mc-rcon.db` // 数据库文件路径

class useSql {
  private dbPath: string
  private db: sqlite3.Database | null
  private initialized: boolean
  constructor(dbPath: string) {
    this.dbPath = dbPath
    this.db = null
    this.initialized = false
  }
  async initialize() {
    if (this.initialized) {
      return
    }

    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database " + err.message)
          reject(err)
        } else {
          console.log("数据库已连接！")
        }
      })
      //建表
      this.db.run(
        `
        create table if not exists player (
          qqNo text primary key,
          mcNickname text not null,
          
          createdTime text default (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
        );`,
        (err) => {
          reject(err)
        }
      )
    })
  }
}
export {}
