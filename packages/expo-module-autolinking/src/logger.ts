import chalk from 'chalk';
import os from 'os';

export abstract class Logger {
  abstract log(...args: any[]): void;

  warn(...args: any[]) {
    this.log(...args.map(arg => chalk.yellow(arg)));
  }

  error(...args: any[]) {
    this.log(...args.map(arg => chalk.red(arg)));
  }

  success(...args: any[]) {
    this.log(...args.map(arg => chalk.green(arg)));
  }
}

export class ConsoleLogger extends Logger {
  log(...args: any[]) {
    console.log(...args);
  }
}

export class NonTTYLogger extends Logger {
  logs: any[] = [];

  log(...args: any[]) {
    this.logs = this.logs.concat(args);
  }

  toString() {
    return this.logs.join(os.EOL);
  }
}

export default process.stdin.isTTY ? new ConsoleLogger() : new NonTTYLogger();
