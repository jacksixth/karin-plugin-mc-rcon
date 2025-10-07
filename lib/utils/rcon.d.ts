import { Rcon } from "rcon-client";
export declare class rconClient {
    client: Rcon;
    private isSending;
    constructor(host: string, port: string, password: string, timeout?: number);
    /**
     * 发送RCON命令到服务器
     * @param command 要执行的RCON命令
     * @returns 命令执行结果的Promise
     */
    send(command: string): Promise<string>;
}
