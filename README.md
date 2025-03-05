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