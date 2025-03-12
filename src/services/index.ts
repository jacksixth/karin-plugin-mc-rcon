import { dirPath } from "@/utils"
import { app } from "node-karin"
import express from "node-karin/express"
import path from "path" // 新增 path 模块导入

// 使用标准化路径拼接
const webPath = path.join(dirPath, "resources", "web")

// 配置静态资源中间件（禁用自动索引）
app.use("/mc-rcon", express.static(webPath, { index: false }))

// 添加错误处理的路由逻辑
app.get("/mc-rcon", (req, res) => {
  res.sendFile(path.join(webPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Internal Server Error")
    }
  })
})
