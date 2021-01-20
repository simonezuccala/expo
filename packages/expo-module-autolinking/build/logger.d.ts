export declare abstract class Logger {
    abstract log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    success(...args: any[]): void;
}
export declare class ConsoleLogger extends Logger {
    log(...args: any[]): void;
}
export declare class NonTTYLogger extends Logger {
    logs: any[];
    log(...args: any[]): void;
    toString(): string;
}
declare const _default: ConsoleLogger | NonTTYLogger;
export default _default;
