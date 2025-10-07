import { pingJava, pingBedrock } from "@minescope/mineping";
import { logger } from "node-karin";
const loggerPluginName = logger.chalk.hex("#90CAF9")(" ===== mc-rcon ===== ");
export const mcMotd = async (_host, _port = 25565) => {
    let host = _host;
    let port = _port;
    if (host.includes(":")) {
        const arr = host.split(":");
        host = arr[0];
        port = parseFloat(arr[1]);
    }
    const javaStatus = await pingJava(host, {
        port,
        timeout: 5000,
    }).catch((err) => {
        logger.error(loggerPluginName, '\n', '--- motd --- \n', err);
        return undefined;
    });
    if (javaStatus) {
        const description = typeof javaStatus.description === "string"
            ? javaStatus.description
            : javaStatus.description.text;
        return {
            version: javaStatus.version.name,
            players: {
                online: javaStatus.players.online,
                max: javaStatus.players.max,
            },
            description: description,
            favicon: javaStatus.favicon
                ? "base64://" + javaStatus.favicon.split(",")[1]
                : "",
            type: "java",
        };
    }
    const bedrockStatus = await pingBedrock(host, {
        port: port,
        timeout: 5000,
    }).catch((err) => {
        logger.error(loggerPluginName, '--- motd --- \n', err);
        return undefined;
    });
    if (bedrockStatus) {
        return {
            version: bedrockStatus.version.minecraftVersion,
            players: {
                online: bedrockStatus.players.online,
                max: bedrockStatus.players.max,
            },
            type: "bedrock",
        };
    }
    return undefined;
};
