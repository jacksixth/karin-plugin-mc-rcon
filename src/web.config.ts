import { Config } from "config/config/config.d"
import { components, logger, writeJsonSync } from "node-karin"
import { config, dirConfig } from "./utils"
export default {
  info: {
    // 插件信息配置
    name: "我的世界服务器",
    description: "",
  },
  /** 动态渲染的组件 */
  components: () => [
    components.divider.create("divider1", {
      description: "服务器配置",
    }),
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
            }),
            components.input.string("password", {
              label: "rcon密码",
            }),
          ],
        }),
      }
    ),
    components.divider.create("divider2", {
      description: "账号配置",
    }),
    components.accordionPro.create(
      "QQNoLinkMcNickname",
      config().QQNoLinkMcNickname.map((item, index) => {
        return {
          ...item,
          title: item.qqNickname,
          subtitle: `${item.qqNo}：${item.mcNickname}`,
        }
      }),
      {
        label: "账号列表",
        children: components.accordionItem.create("account-item", {
          title: "账号",
          subtitle: "配置你的账号",
          children: [
            components.input.number("qqNo", {
              label: "QQ号",
              rules: [
                {
                  regex: /^[1-9][0-9]{4,10}$/,
                  error: "请输入正确的QQ号",
                },
              ],
            }),
            components.input.string("qqNickname", {
              label: "QQ昵称",
            }),
            components.input.string("mcNickname", {
              label: "mc昵称",
            }),
          ],
        }),
      }
    ),
    components.input.group("banQQ", {
      label: "封禁QQ号组",
      template: {
        componentType: "input",
        key: "banQQ",
        placeholder: "请输入QQ号",
        rules: [{ regex: /^[1-9][0-9]{4,10}$/, error: "请输入正确的QQ号" }],
      },
      data: [...config().banQQ],
    }),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: Config) => {
    logger.info("保存的配置:", config)
    writeJsonSync(`${dirConfig}/config.json`, config)
    return {
      success: true,
      message: "保存成功, 请刷新页面。",
    }
  },
}
