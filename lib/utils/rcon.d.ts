import { Rcon } from "rcon-client";
export declare class rconClient {
    client: Rcon;
    private isSending;
    constructor(host: string, port: number, password: string);
    /**
     * 发送RCON命令到服务器
     * @param command 要执行的RCON命令
     * @returns 命令执行结果的Promise
     */
    send(command: string): Promise<string>;
}
export declare class RconManager {
    private connections;
    /**
     * 创建RCON连接管理器
     * @param servers 服务器配置数组，格式为 { host: string, port: number, password: string }
     */
    constructor(servers: Array<{
        host: string;
        port: number;
        password: string;
    }>);
    /**
     * 向指定服务器发送RCON命令
     * @param serverKey 服务器唯一标识（格式： host:port ）
     * @param command 要执行的RCON命令
     * @returns 命令执行结果Promise
     */
    sendToServer(serverKey: string, command: string): Promise<string>;
}
