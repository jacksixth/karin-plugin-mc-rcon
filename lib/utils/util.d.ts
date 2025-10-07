/**
 * 生成随机数
 * @param min - 最小值
 * @param max - 最大值
 * @returns
 */
export declare const random: (min: number, max: number) => any;
/**
 * 睡眠函数
 * @param ms - 毫秒
 */
export declare const sleep: (ms: number) => Promise<unknown>;
/**
 * 使用moment返回时间
 * @param format - 格式
 */
export declare const time: (format?: string) => string;
/**
 * 校验主机名格式，域名|ip
 */
export declare function isValidHost(host: string): boolean;
/**
 * 校验端口号格式
 */
export declare function isValidPort(port: string): boolean;
