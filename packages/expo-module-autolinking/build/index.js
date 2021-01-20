"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModulesAsync = exports.verifySearchResults = exports.mergeLinkingOptionsAsync = exports.findModulesAsync = exports.findDefaultPathsAsync = exports.findPackageJsonPathAsync = exports.resolveSearchPathsAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const find_up_1 = __importDefault(require("find-up"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
async function resolveSearchPathsAsync(searchPaths, cwd) {
    return searchPaths && searchPaths.length > 0
        ? searchPaths.map(searchPath => path_1.default.resolve(cwd, searchPath))
        : await findDefaultPathsAsync(cwd);
}
exports.resolveSearchPathsAsync = resolveSearchPathsAsync;
/**
 * Finds project's package.json and returns its path.
 */
async function findPackageJsonPathAsync() {
    return (await find_up_1.default('package.json', { cwd: process.cwd() })) ?? null;
}
exports.findPackageJsonPathAsync = findPackageJsonPathAsync;
/**
 * Looks up for workspace's `node_modules` paths.
 */
async function findDefaultPathsAsync(cwd) {
    const paths = [];
    let dir = cwd;
    let pkgJsonPath;
    while ((pkgJsonPath = await find_up_1.default('package.json', { cwd: dir }))) {
        dir = path_1.default.dirname(path_1.default.dirname(pkgJsonPath));
        paths.push(path_1.default.join(pkgJsonPath, '..', 'node_modules'));
    }
    return paths;
}
exports.findDefaultPathsAsync = findDefaultPathsAsync;
/**
 * Searches for modules to link based on given config.
 */
async function findModulesAsync(platform, providedOptions) {
    const config = await mergeLinkingOptionsAsync(platform, providedOptions);
    const results = {};
    for (const searchPath of config.searchPaths) {
        const paths = await fast_glob_1.default('**/unimodule.json', {
            cwd: searchPath,
        });
        for (const packageConfigPath of paths) {
            const packagePath = fs_1.default.realpathSync(path_1.default.join(searchPath, path_1.default.dirname(packageConfigPath)));
            const packageConfig = require(path_1.default.join(packagePath, 'unimodule.json'));
            const { name, version } = require(path_1.default.join(packagePath, 'package.json'));
            if (config.exclude?.includes(name) || !packageConfig.platforms?.includes(platform)) {
                continue;
            }
            const currentRevision = {
                path: packagePath,
                version,
            };
            if (!results[name]) {
                // The revision that was found first will be the main one.
                // An array of duplicates is needed only here.
                results[name] = { ...currentRevision, duplicates: [] };
            }
            else if (results[name].path !== packagePath &&
                results[name].duplicates?.every(({ path }) => path !== packagePath)) {
                results[name].duplicates?.push(currentRevision);
            }
        }
    }
    return results;
}
exports.findModulesAsync = findModulesAsync;
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expoModules` field
 * - platform-specific options from the above (e.g. `expoModules.ios`)
 * - options provided to the CLI command
 */
async function mergeLinkingOptionsAsync(platform, providedOptions) {
    const packageJsonPath = await findPackageJsonPathAsync();
    const packageJson = packageJsonPath ? require(packageJsonPath) : {};
    const baseOptions = packageJson.expo?.autolinking;
    const platformOptions = baseOptions?.[platform];
    const allOptions = [providedOptions, platformOptions, baseOptions];
    function pickMergedValue(key) {
        for (const obj of allOptions) {
            if (obj?.[key]) {
                return obj[key];
            }
        }
        return null;
    }
    return {
        searchPaths: await resolveSearchPathsAsync(pickMergedValue('searchPaths'), process.cwd()),
        ignorePaths: pickMergedValue('ignorePaths'),
        exclude: pickMergedValue('exclude'),
    };
}
exports.mergeLinkingOptionsAsync = mergeLinkingOptionsAsync;
/**
 * Verifies the search results by checking whether there are no duplicates.
 * A custom logger (e.g. non-TTY) can be provided.
 */
function verifySearchResults(searchResults, logger = new logger_1.ConsoleLogger()) {
    const cwd = process.cwd();
    const relativePath = pkg => path_1.default.relative(cwd, pkg.path);
    let counter = 0;
    for (const moduleName in searchResults) {
        const revision = searchResults[moduleName];
        if (revision.duplicates?.length) {
            logger.warn(`⚠️  Found multiple revisions of ${chalk_1.default.green(moduleName)}`);
            logger.log(` - ${chalk_1.default.magenta(relativePath(revision))} (${chalk_1.default.cyan(revision.version)})`);
            for (const duplicate of revision.duplicates) {
                logger.log(` - ${chalk_1.default.gray(relativePath(duplicate))} (${chalk_1.default.gray(duplicate.version)})`);
            }
            counter++;
        }
    }
    if (counter > 0) {
        logger.warn('⚠️  Please get rid of multiple revisions as it may introduce some side effects or compatibility issues');
    }
    return counter;
}
exports.verifySearchResults = verifySearchResults;
/**
 * Resolves search results to a list of platform-specific configuration.
 */
async function resolveModulesAsync(platform, searchResults) {
    const platformLinking = require(`./resolvers/${platform}`);
    return (await Promise.all(Object.entries(searchResults).map(([packageName, revision]) => platformLinking.resolveModuleAsync(packageName, revision)))).filter(Boolean);
}
exports.resolveModulesAsync = resolveModulesAsync;
//# sourceMappingURL=index.js.map