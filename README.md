# karin-plugin-mc-rcon

karin 插件，使用 ts 开发。
需要搭配 [karin](https://karin.fun/) 使用。

## 安装

1. 安装该插件
   - `包管理器` 可以通过 `pnpm add karin-plugin-mc-rcon@latest -w` 安装
   - `使用编译产物` 可以 clone 该仓库的 build 分支 `git clone --depth=1 -b build https://github.com/jacksixth/karin-plugin-mc-rcon.git ./plugins/karin-plugin-mc-rcon/`，然后通过运行 `pnpm install --filter=karin-plugin-mc-rcon` 安装
2. 运行 `npx karin .`
3. 在 karin web 界面的插件页签中配置该插件
4. 保存配置后即可使用

## 功能

所有需要 rcon 的命令均只支持 java 版我的世界 且服务器需开启 rcon 功能

白名单相关命令需要服务器开启白名单功能 server.properties 中的 enable-whitelist 需要为 true

命令里的 `<>` 表示必填参数（不用输入尖括号）；服务器别名含空格时请用尖括号包起来，如 `#apply <生存服 A> Steve`

| 命令语法                                           | 功能描述                                                                                                                                             | 状态 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `#motd <host>:<port>` `<br>` `#motd <host> <port>` | 查询 Minecraft 服务器状态（支持 Java/基岩版）                                                                                                        | ✅   |
| `#(server list\|服务器状态)`                       | 列出所有服务器信息（伪造转发消息防刷屏）`<br>` - 别名/地址 `<br>` - 服务器图标 `<br>` - 描述 `<br>` - 服务器版本 `<br>` - 在线人数 `<br>` - 玩家列表 | ✅   |
| `#(rcon\|发送命令) <serverAlias\|ALL> <commend>`   | 向单个/所有服务器发送 RCON 命令（群主/群管理员或机器人主人）                                                                                          | ✅   |
| `#(apply\|申请) <serverAlias> <mc昵称>`             | 申请加入服务器白名单（需管理员审批后才会写入服务器白名单）                                                                                            | ✅   |
| `#(req\|申请列表)`                                  | 查看待审批的白名单申请（群主/群管理员或机器人主人）                                                                                                   | ✅   |
| `#(ok\|通过) <序号>` / `#(no\|拒绝) <序号>`          | 通过 / 拒绝白名单申请（群主/群管理员或机器人主人）                                                                                                    | ✅   |
| `#(wl\|白名单) <serverAlias> [del <昵称>]`          | 查看服务器白名单 / 移出某个昵称（群主/群管理员或机器人主人）                                                                                         | ✅   |
|                                                    | 入群欢迎                                                                                                                                             | ✅   |
|                                                    | 连接[鹊桥 mod](https://queqiao-docs.pages.dev/)                                                                                                      | 🚧   |
| `#(help\|帮助)`                                    | 查看本插件所有命令                                                                                                                                   | ✅   |
