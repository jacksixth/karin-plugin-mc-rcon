import { Config } from "config/config/config.d"
import { components, logger } from "node-karin"
import { config, saveConfig } from "./utils"
export default {
  info: {
    // 插件信息配置
    name: "我的世界服务器",
    description: "",
  },
  /** 动态渲染的组件 */
  components: () => [
    components.accordionPro.create(
      "servers",
      config().servers.map((item, index) => {
        return {
          ...item,
          title: item.alias,
          subtitle: `${item.host}:${item.port}`,
        }
      }),
      {
        label: "服务器列表",
        children: components.accordionItem.create("servers-item", {
          title: "服务器",
          subtitle: "配置你的服务器",
          children: [
            components.input.string("alias", {
              label: "服务器别名",
            }),
            components.input.string("host", {
              label: "服务器host",
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
              rules: [
                { min: 1, max: 65535 },
                {
                  regex: /^(?:0|(?:-?[1-9]\d*))$/,
                  error: "请输入正确的端口号",
                },
              ],
            }),
            components.input.number("rconPort", {
              label: "服务器rcon端口",
              rules: [
                { min: 1, max: 65535 },
                {
                  regex: /^(?:0|(?:-?[1-9]\d*))$/,
                  error: "请输入正确的端口号",
                },
              ],
              isRequired: false,
            }),
            components.input.string("password", {
              label: "rcon密码",
              isRequired: false,
            }),
          ],
        }),
      }
    ),
    components.accordionPro.create(
      "requests",
      config().requests.map((item) => {
        return {
          ...item,
          title: item.nick,
          subtitle: `${item.alias} · ${item.time}`,
        }
      }),
      {
        label: "白名单申请",
        children: components.accordionItem.create("requests-item", {
          title: "申请",
          subtitle: "待审批的白名单申请",
          children: [
            components.input.string("id", {
              label: "申请人标识",
            }),
            components.input.string("nick", {
              label: "MC昵称",
            }),
            components.input.string("alias", {
              label: "服务器别名",
            }),
            components.input.string("time", {
              label: "申请时间",
            }),
          ],
        }),
      }
    ),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    logger.info("保存配置")
    const ok = saveConfig(config)
    return {
      success: ok,
      message: ok ? "保存成功, 请刷新页面。" : "保存失败, 请检查日志。",
    }
  },
}
