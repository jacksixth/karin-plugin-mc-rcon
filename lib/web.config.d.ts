import { Config } from "config/config/config.d";
declare const _default: {
    info: {
        name: string;
        description: string;
    };
    /** 动态渲染的组件 */
    components: () => (import("node-karin").InputGroupProps | import("node-karin").AccordionProProps)[];
    /** 前端点击保存之后调用的方法 */
    save: (config: Config) => {
        success: boolean;
        message: string;
    };
};
export default _default;
