import { Logger } from './logger';
import { AutolinkingPlatform, ModuleDescriptor, SearchOptions, SearchResults } from './types';
/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
export declare function resolveSearchPathsAsync(searchPaths: string[] | null, cwd: string): Promise<string[]>;
/**
 * Finds project's package.json and returns its path.
 */
export declare function findPackageJsonPathAsync(): Promise<string | null>;
/**
 * Looks up for workspace's `node_modules` paths.
 */
export declare function findDefaultPathsAsync(cwd: string): Promise<string[]>;
/**
 * Searches for modules to link based on given config.
 */
export declare function findModulesAsync(platform: AutolinkingPlatform, providedOptions: SearchOptions): Promise<SearchResults>;
/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expoModules` field
 * - platform-specific options from the above (e.g. `expoModules.ios`)
 * - options provided to the CLI command
 */
export declare function mergeLinkingOptionsAsync(platform: AutolinkingPlatform, providedOptions: SearchOptions): Promise<SearchOptions>;
/**
 * Verifies the search results by checking whether there are no duplicates.
 * A custom logger (e.g. non-TTY) can be provided.
 */
export declare function verifySearchResults(searchResults: SearchResults, logger?: Logger): number;
/**
 * Resolves search results to a list of platform-specific configuration.
 */
export declare function resolveModulesAsync(platform: string, searchResults: SearchResults): Promise<ModuleDescriptor[]>;
