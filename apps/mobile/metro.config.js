const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the monorepo root for changes in shared packages
config.watchFolders = [monorepoRoot]

// Let Metro know where to resolve packages from monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// Force resolving modules from the mobile app's node_modules first
config.resolver.disableHierarchicalLookup = true

module.exports = config
