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

| 命令语法                                           | 功能描述                                                                                                                                             | 状态 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `#motd <host>:<port>` `<br>` `#motd <host> <port>` | 查询 Minecraft 服务器状态（支持 Java/基岩版）                                                                                                        | ✅   |
| `#(server list\|服务器状态)`                       | 列出所有服务器信息（伪造转发消息防刷屏）`<br>` - 别名/地址 `<br>` - 服务器图标 `<br>` - 描述 `<br>` - 服务器版本 `<br>` - 在线人数 `<br>` - 玩家列表 | ✅   |
| `#(rcon\|发送命令) <serverAlias\|ALL> <commend>`   | 向单个/所有服务器发送 RCON 命令（管理员专属）                                                                                                        | ✅   |
|                                                    | 连接[鹊桥 mod](https://queqiao-docs.pages.dev/)                                                                                                      | 🚧   |
| `#(help\|帮助)`                                    | 查看本插件所有命令                                                                                                                                   | ✅   |
