import { dirPath } from "@/utils"
import { app } from "node-karin"
import express from "node-karin/express"
import path from "path"
//部署web页面
const webPath = path.join(dirPath, "resources", "web")
app.use("/mc-rcon", express.static(webPath, { index: false }))
app.use("/mc-rcon/*", (req, res) => {
  res.sendFile(path.join(webPath, "index.html"), (err) => {
    if (err) {
      console.error("File send error:", err)
      res.status(500).send("Application loading failed")
    }
  })
})

const router = express.Router()

function isJwtExpired(token: string) {
  // 分割 JWT，获取 payload 部分
  const payloadBase64 = token.split(".")[1]
  // 解码 Base64 编码的 payload
  const payload = JSON.parse(atob(payloadBase64))
  // 获取当前时间的时间戳（秒）
  const currentTime = Math.floor(Date.now() / 1000)
  // 检查 JWT 是否过期
  return payload.exp < currentTime
}
router.get("/checkJWT", (req, res) => {
  //获取请求头中的 Authorization 字段
  const authorization = req.headers.authorization || ""
  res.send({ code: isJwtExpired(authorization) ? 401 : 200 })
})

app.use("/api/mc-rcon", router)
