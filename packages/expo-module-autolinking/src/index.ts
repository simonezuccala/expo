import chalk from 'chalk';
import glob from 'fast-glob';
import findUp from 'find-up';
import fs from 'fs';
import path from 'path';

import { ConsoleLogger, Logger } from './logger';
import {
  AutolinkingPlatform,
  ModuleDescriptor,
  PackageRevision,
  SearchOptions,
  SearchResults,
} from './types';

/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
export async function resolveSearchPathsAsync(
  searchPaths: string[] | null,
  cwd: string
): Promise<string[]> {
  return searchPaths && searchPaths.length > 0
    ? searchPaths.map(searchPath => path.resolve(cwd, searchPath))
    : await findDefaultPathsAsync(cwd);
}

/**
 * Finds project's package.json and returns its path.
 */
export async function findPackageJsonPathAsync(): Promise<string | null> {
  return (await findUp('package.json', { cwd: process.cwd() })) ?? null;
}
/**
 * Looks up for workspace's `node_modules` paths.
 */
export async function findDefaultPathsAsync(cwd: string): Promise<string[]> {
  const paths = [];
  let dir = cwd;
  let pkgJsonPath: string | undefined;

  while ((pkgJsonPath = await findUp('package.json', { cwd: dir }))) {
    dir = path.dirname(path.dirname(pkgJsonPath));
    paths.push(path.join(pkgJsonPath, '..', 'node_modules'));
  }
  return paths;
}

/**
 * Searches for modules to link based on given config.
 */
export async function findModulesAsync(
  platform: AutolinkingPlatform,
  providedOptions: SearchOptions
): Promise<SearchResults> {
  const config = await mergeLinkingOptionsAsync(platform, providedOptions);
  const results: SearchResults = {};

  for (const searchPath of config.searchPaths) {
    const paths = await glob('**/unimodule.json', {
      cwd: searchPath,
      ignore: [
        '**/__tests__',
        '**/.expo',
        '**/android',
        '**/apple',
        '**/bin',
        '**/build',
        '**/dist',
        '**/docs',
        '**/ios',
        '**/jest',
        '**/js',
        '**/lib',
        '**/macos',
        '**/plugin',
        '**/scripts',
        '**/src',
        '**/test',
        '**/types',
        '**/typescript',
        '**/typings',
        '**/windows',
      ],
    });

    for (const packageConfigPath of paths) {
      const packagePath = fs.realpathSync(path.join(searchPath, path.dirname(packageConfigPath)));
      const packageConfig = require(path.join(packagePath, 'unimodule.json'));
      const { name, version } = require(path.join(packagePath, 'package.json'));

      if (config.exclude?.includes(name) || !packageConfig.platforms?.includes(platform)) {
        continue;
      }

      const currentRevision: PackageRevision = {
        path: packagePath,
        version,
      };

      if (!results[name]) {
        // The revision that was found first will be the main one.
        // An array of duplicates is needed only here.
        results[name] = { ...currentRevision, duplicates: [] };
      } else if (
        results[name].path !== packagePath &&
        results[name].duplicates?.every(({ path }) => path !== packagePath)
      ) {
        results[name].duplicates?.push(currentRevision);
      }
    }
  }
  return results;
}

/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expoModules` field
 * - platform-specific options from the above (e.g. `expoModules.ios`)
 * - options provided to the CLI command
 */
export async function mergeLinkingOptionsAsync(
  platform: AutolinkingPlatform,
  providedOptions: SearchOptions
): Promise<SearchOptions> {
  const packageJsonPath = await findPackageJsonPathAsync();
  const packageJson = packageJsonPath ? require(packageJsonPath) : {};
  const baseOptions = packageJson.expo?.autolinking;
  const platformOptions = baseOptions?.[platform];
  const allOptions: Partial<SearchOptions>[] = [providedOptions, platformOptions, baseOptions];

  function pickMergedValue<T extends keyof SearchOptions>(key: T): SearchOptions[T] | null {
    for (const obj of allOptions) {
      if (obj?.[key]) {
        return obj[key]!;
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

/**
 * Verifies the search results by checking whether there are no duplicates.
 * A custom logger (e.g. non-TTY) can be provided.
 */
export function verifySearchResults(
  searchResults: SearchResults,
  logger: Logger = new ConsoleLogger()
): number {
  const cwd = process.cwd();
  const relativePath: (pkg: PackageRevision) => string = pkg => path.relative(cwd, pkg.path);
  let counter = 0;

  for (const moduleName in searchResults) {
    const revision = searchResults[moduleName];

    if (revision.duplicates?.length) {
      logger.warn(`⚠️  Found multiple revisions of ${chalk.green(moduleName)}`);
      logger.log(` - ${chalk.magenta(relativePath(revision))} (${chalk.cyan(revision.version)})`);

      for (const duplicate of revision.duplicates) {
        logger.log(` - ${chalk.gray(relativePath(duplicate))} (${chalk.gray(duplicate.version)})`);
      }
      counter++;
    }
  }
  if (counter > 0) {
    logger.warn(
      '⚠️  Please get rid of multiple revisions as it may introduce some side effects or compatibility issues'
    );
  }
  return counter;
}

/**
 * Resolves search results to a list of platform-specific configuration.
 */
export async function resolveModulesAsync(
  platform: string,
  searchResults: SearchResults
): Promise<ModuleDescriptor[]> {
  const platformLinking = require(`./platforms/${platform}`);

  return (
    await Promise.all(
      Object.entries(searchResults).map(([packageName, revision]) =>
        platformLinking.resolveModuleAsync(packageName, revision)
      )
    )
  ).filter(Boolean);
}

export async function generatePackageListAsync(
  modules: ModuleDescriptor[],
  platform: string,
  targetPath: string,
  namespace: string
) {
  const platformLinking = require(`./platforms/${platform}`);
  await platformLinking.generatePackageListAsync(modules, targetPath, namespace);
}
