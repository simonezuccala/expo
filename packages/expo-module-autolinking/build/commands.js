"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const process_1 = __importDefault(require("process"));
const _1 = require(".");
const logger_1 = __importStar(require("./logger"));
registerSearchingCommand('search', async (results) => {
    console.log(require('util').inspect(results, false, null, true));
});
registerSearchingCommand('resolve', async (results, command) => {
    const modules = await _1.resolveModulesAsync(command.platform, results);
    console.log(modules);
});
registerSearchingCommand('json', async (results, command) => {
    const modules = await _1.resolveModulesAsync(command.platform, results);
    const logger = new logger_1.NonTTYLogger();
    logger.log('Using Expo modules');
    _1.verifySearchResults(results, logger);
    console.log(JSON.stringify({
        logs: logger.toString(),
        modules,
    }));
});
registerSearchingCommand('verify', results => {
    const numberOfDuplicates = _1.verifySearchResults(results);
    if (!numberOfDuplicates) {
        logger_1.default.success('✅ Everything is fine!');
    }
});
registerSearchingCommand('generate-package-list', async (results, command) => {
    const modules = await _1.resolveModulesAsync(command.platform, results);
    _1.generatePackageListAsync(modules, command.platform, command.target, command.namespace);
})
    .option('-t, --target <path>', 'Path to the target file, where the package list should be written to.')
    .option('-n, --namespace <namespace>', 'Java package name under which the package list should be placed.');
commander_1.default
    .version(require('expo-module-autolinking/package.json').version)
    .description('CLI command that searches for Expo modules to autolink them.')
    .parseAsync(process_1.default.argv);
/**
 * Factory for commands that need to search first and shares the same options.
 */
function registerSearchingCommand(commandName, fn) {
    return commander_1.default
        .command(`${commandName} [paths...]`)
        .option('-p, --platform [platform]', 'The platform that the resulted modules must support. Available options: "ios", "android"', 'ios')
        .option('-i, --ignore-paths [ignorePaths...]', 'Paths to ignore when looking up for modules.', (value, previous) => (previous ?? []).concat(value), null)
        .option('-e, --exclude [exclude...]', 'Package names to exclude when looking up for modules.', (value, previous) => (previous ?? []).concat(value), null)
        .action(async (searchPaths, command) => {
        const options = {
            searchPaths,
            ignorePaths: command.ignorePaths,
            exclude: command.exclude,
        };
        const searchResults = await _1.findModulesAsync(command.platform, options);
        return await fn(searchResults, command);
    });
}
//# sourceMappingURL=commands.js.map