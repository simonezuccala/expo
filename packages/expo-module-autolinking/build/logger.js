"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NonTTYLogger = exports.ConsoleLogger = exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const os_1 = __importDefault(require("os"));
class Logger {
    warn(...args) {
        this.log(...args.map(arg => chalk_1.default.yellow(arg)));
    }
    error(...args) {
        this.log(...args.map(arg => chalk_1.default.red(arg)));
    }
    success(...args) {
        this.log(...args.map(arg => chalk_1.default.green(arg)));
    }
}
exports.Logger = Logger;
class ConsoleLogger extends Logger {
    log(...args) {
        console.log(...args);
    }
}
exports.ConsoleLogger = ConsoleLogger;
class NonTTYLogger extends Logger {
    constructor() {
        super(...arguments);
        this.logs = [];
    }
    log(...args) {
        this.logs = this.logs.concat(args);
    }
    toString() {
        return this.logs.join(os_1.default.EOL);
    }
}
exports.NonTTYLogger = NonTTYLogger;
exports.default = process.stdin.isTTY ? new ConsoleLogger() : new NonTTYLogger();
//# sourceMappingURL=logger.js.map