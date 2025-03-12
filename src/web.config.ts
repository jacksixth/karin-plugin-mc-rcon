import { Config } from "config/config/config.d"
import { components, logger, writeJsonSync } from "node-karin"
import { config, dirConfig } from "./utils"
const defConfig = config() as Config
export default {
  info: {
    // 插件信息配置
    name: "karin-plugin-mc-rcon",
    description: "占位",
  },
  /** 动态渲染的组件 */
  components: () => [
    // components.accordionPro.create(
    //   "servers",
    //   defConfig.servers.map((item, index) => {
    //     return {
    //       ...item,
    //       title: item.alias,
    //       subtitle: `${item.host}:${item.port}`,
    //     }
    //   }),
    //   {
    //     label: "服务器列表",
    //     description: "配置你的服务器列表",
    //     children: components.accordion.createItem("servers-item", {
    //       title: "服务器",
    //       subtitle: "配置你的服务器",
    //       children: [
    //         components.input.string("alias", {
    //           label: "服务器别名",
    //         }),
    //         components.input.string("host", {
    //           label: "服务器host",
    //           rules: [
    //             {
    //               regex:
    //                 /^((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])$|^([0-9a-zA-Z-]{1,}\.)+([a-zA-Z]{2,})$/,
    //               error: "请输入正确的IP地址或域名",
    //             },
    //           ],
    //         }),
    //         components.input.number("port", {
    //           label: "服务器端口",
    //           rules: [{ min: 1, max: 65535 }],
    //         }),
    //         components.input.number("rconPort", {
    //           label: "服务器rcon端口",
    //           rules: [{ min: 1, max: 65535 }],
    //         }),
    //         components.input.string("password", {
    //           label: "rcon密码",
    //         }),
    //       ],
    //     }),
    //   }
    // ),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    return {
      success: true,
      message: "保存成功",
    }
  },
}
