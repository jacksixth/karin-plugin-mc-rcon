export declare const mcMotd: (_host: string, _port?: number) => Promise<{
    version: string;
    players: {
        online: number;
        max: number;
    };
    description: string;
    favicon: string;
    type: string;
} | {
    version: string;
    players: {
        online: number;
        max: number;
    };
    type: string;
    description?: undefined;
    favicon?: undefined;
} | undefined>;
