import { Config } from "config/config/config.d"
import { components, logger, writeJsonSync } from "node-karin"
import { config, dirConfig } from "./utils"
const defConfig = config() as Config
export default {
  info: {
    // 插件信息配置
  },
  /** 动态渲染的组件 */
  components: () => [
    components.accordionPro.create("servers", defConfig.servers, {
      label: "服务器列表",
      description: "配置你的服务器列表",
      children: components.accordion.createItem("servers-item", {
        title: "服务器",
        children: [
          components.input.string("host", {
            label: "服务器host",
            defaultValue: "localhost",
            rules: [
              {
                regex:
                  /^((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])$|^([0-9a-zA-Z-]{1,}\.)+([a-zA-Z]{2,})$/,
                error: "请输入正确的IP地址或域名",
              },
            ],
          }),
          components.input.number("port", {
            label: "服务器端口",
            defaultValue: "25565",
            rules: [{ min: 1, max: 65535 }],
          }),
          components.input.number("rconPort", {
            label: "服务器rcon端口",
            defaultValue: "25575",
            rules: [{ min: 1, max: 65535 }],
          }),
          components.input.string("password", {
            label: "rcon密码",
            defaultValue: "password",
          }),
        ],
      }),
    }),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    //新配置覆盖旧配置
    const newConfig = Object.assign(defConfig, config)
    logger.info("保存的配置:", newConfig)
    // 保存配置到文件
    writeJsonSync(`${dirConfig}/config.json`, newConfig)
    return {
      success: true,
      message: "保存成功",
    }
  },
}
