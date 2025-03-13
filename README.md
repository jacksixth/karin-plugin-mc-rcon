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

| 命令语法                                                          | 功能描述                                                                                                                                                            | 状态 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `#motd <host>:<port>` `<br>` `#motd <host> <port>`          | 查询 Minecraft 服务器状态（支持 Java/基岩版）                                                                                                                       | ✅   |
| `#server add <host> <port> <rconPort> <password> <serverAlias>` | 添加服务器（需管理员私聊操作）                                                                                                                                      | ✅   |
| `#server remove <serverAlias>`                                  | 删除服务器（需管理员私聊操作）                                                                                                                                      | ✅   |
| `#server list`                                                  | 列出所有服务器信息（伪造转发消息防刷屏）`<br>` - 服务器图标 `<br>` - 别名/地址/版本 `<br>` - 在线状态 `<br>` - 描述 `<br>` - 在线人数 `<br>` - 玩家列表 | ✅   |
| `#server info <serverAlias>`                                    | 查看单个服务器详情                                                                                                                                                  | ✅   |
| `#server wlon <serverAlias>`                                    | 开启服务器白名单（管理员专属）                                                                                                                                      | ✅   |
| `#server wloff <serverAlias>`                                   | 关闭服务器白名单（管理员专属）                                                                                                                                      | ✅   |
| `#server wllist <serverAlias>`                                  | 查看服务器白名单（管理员专属）                                                                                                                                      | ✅   |
| `#rcon <serverAlias\|ALL> <commend>`                             | 向单个/所有服务器发送 RCON 命令（管理员专属）                                                                                                                       | ✅   |
| `#bind <nickName>`                                              | 绑定 QQ 号与游戏昵称                                                                                                                                                | ✅   |
| `#unbind`                                                       | 解绑游戏昵称                                                                                                                                                        | ✅   |
| `#bindlist`                                                     | 查看所有 QQ 号与游戏昵称绑定关系（管理员专属）                                                                                                                      | 🚧   |
| `#ban <nickName>`                                               | 封禁玩家（无法使用机器人功能）（管理员专属）                                                                                                                        | 🚧   |
| `#apply <nickName> <serverAlias>`                               | 申请加入服务器白名单                                                                                                                                                | 🚧   |
| `#revoke <nickName> <serverAlias>`                              | 撤销服务器白名单权限（管理员专属）                                                                                                                                  | 🚧   |
|                                                                   | 退群清除 QQ 号绑定游戏昵称及服务器白名单                                                                                                                            | 🚧   |
|                                                                   | 定时任务-保存服务器内正在游玩的玩家名至数据库                                                                                                                       | 🚧   |
| `#render <serverAlias>`                                         | 渲染服务器近 7 天玩家数折线图                                                                                                                                       | 🚧   |
| `#voidhelp`                                                     | 查看本插件所有命令                                                                                                                                                  | 🚧   |
