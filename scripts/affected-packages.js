#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT_DIR = path.resolve(__dirname, '..')
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages')
const INTERNAL_DEP_SECTIONS = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
  'devDependencies'
]

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: ROOT_DIR,
    encoding: 'utf8'
  })

  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim()
    throw new Error(`git ${args.join(' ')} failed${details ? `: ${details}` : ''}`)
  }

  return result.stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function parseArgs(argv) {
  const args = {
    since: null,
    help: false
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (arg === '--') {
      continue
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    } else if (arg === '--since') {
      args.since = argv[++index]
    } else if (arg.startsWith('--since=')) {
      args.since = arg.slice('--since='.length)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (args.since === '') {
    throw new Error('--since requires a git ref, for example: --since main')
  }

  return args
}

function printHelp() {
  console.log(`Usage:
  pnpm affected:packages
  pnpm affected:packages -- --since main

Options:
  --since <ref>  Include package changes from git diff <ref>...HEAD.
  -h, --help     Show this help message.

Notes:
  The script only reports impact. It does not choose semver levels or edit versions.
  Default mode checks tracked changes against HEAD and untracked files under packages/.
`)
}

function loadPackages() {
  const packageDirs = fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(dir => fs.existsSync(path.join(PACKAGES_DIR, dir, 'package.json')))
    .sort()

  const packages = packageDirs.map(dir => {
    const packageJsonPath = path.join(PACKAGES_DIR, dir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    return {
      dir,
      name: packageJson.name,
      packageJson
    }
  })

  const byName = new Map(packages.map(pkg => [pkg.name, pkg]))
  const byDir = new Map(packages.map(pkg => [pkg.dir, pkg]))

  return {
    packages,
    byName,
    byDir
  }
}

function buildInternalDependencyGraph(packages, byName) {
  const directDependencies = new Map(packages.map(pkg => [pkg.name, []]))
  const directDependents = new Map(packages.map(pkg => [pkg.name, []]))

  for (const pkg of packages) {
    for (const section of INTERNAL_DEP_SECTIONS) {
      const deps = pkg.packageJson[section] || {}

      for (const [depName, range] of Object.entries(deps)) {
        if (!byName.has(depName)) continue

        const edge = {
          from: pkg.name,
          to: depName,
          section,
          range
        }

        directDependencies.get(pkg.name).push(edge)
        directDependents.get(depName).push(edge)
      }
    }
  }

  for (const edges of directDependencies.values()) {
    edges.sort((a, b) => a.to.localeCompare(b.to))
  }

  for (const edges of directDependents.values()) {
    edges.sort((a, b) => a.from.localeCompare(b.from))
  }

  return {
    directDependencies,
    directDependents
  }
}

function getChangedFiles(since) {
  const files = new Set()

  if (since) {
    for (const file of runGit(['diff', '--name-only', `${since}...HEAD`, '--', 'packages'])) {
      files.add(file)
    }
  }

  for (const file of runGit(['diff', '--name-only', 'HEAD', '--', 'packages'])) {
    files.add(file)
  }

  for (const file of runGit(['ls-files', '--others', '--exclude-standard', '--', 'packages'])) {
    files.add(file)
  }

  return [...files].sort()
}

function packageDirFromFile(file) {
  const parts = file.split('/')

  if (parts[0] !== 'packages' || !parts[1]) {
    return null
  }

  return parts[1]
}

function getChangedPackages(changedFiles, byDir) {
  const changed = new Set()

  for (const file of changedFiles) {
    const dir = packageDirFromFile(file)

    if (dir && byDir.has(dir)) {
      changed.add(byDir.get(dir).name)
    }
  }

  return [...changed].sort()
}

function collectDirectDependents(packageNames, directDependents) {
  const result = new Set()

  for (const packageName of packageNames) {
    for (const edge of directDependents.get(packageName) || []) {
      if (!packageNames.includes(edge.from)) {
        result.add(edge.from)
      }
    }
  }

  return [...result].sort()
}

function collectTransitiveDependents(packageNames, directDependents) {
  const changedSet = new Set(packageNames)
  const result = new Set()
  const queue = [...packageNames]

  while (queue.length > 0) {
    const current = queue.shift()

    for (const edge of directDependents.get(current) || []) {
      if (changedSet.has(edge.from) || result.has(edge.from)) {
        continue
      }

      result.add(edge.from)
      queue.push(edge.from)
    }
  }

  return [...result].sort()
}

function shortName(packageName) {
  return packageName.replace('@unisat/', '')
}

function formatList(items) {
  if (items.length === 0) {
    return '  - None'
  }

  return items.map(item => `  - ${shortName(item)}`).join('\n')
}

function formatDependentsWithReasons(items, changedPackages, directDependents) {
  if (items.length === 0) {
    return '  - None'
  }

  return items
    .map(item => {
      const reasons = changedPackages
        .filter(changedPackage =>
          (directDependents.get(changedPackage) || []).some(edge => edge.from === item)
        )
        .map(shortName)

      return reasons.length > 0
        ? `  - ${shortName(item)} (depends on ${reasons.join(', ')})`
        : `  - ${shortName(item)}`
    })
    .join('\n')
}

function printReport({ since, changedFiles, changedPackages, directImpacted, transitiveImpacted, directDependents }) {
  console.log('Package impact report')
  console.log('=====================')
  console.log(`Mode: ${since ? `git diff ${since}...HEAD + current worktree` : 'current worktree vs HEAD'}`)
  console.log('')

  console.log('Changed packages:')
  console.log(formatList(changedPackages))
  console.log('')

  if (changedPackages.length === 0) {
    console.log('No package changes detected under packages/.')
    return
  }

  console.log('Direct dependents to check:')
  console.log(formatDependentsWithReasons(directImpacted, changedPackages, directDependents))
  console.log('')

  console.log('Transitive dependents to consider:')
  console.log(formatList(transitiveImpacted))
  console.log('')

  console.log('Changed files:')
  for (const file of changedFiles) {
    console.log(`  - ${file}`)
  }
  console.log('')

  console.log('Versioning reminder:')
  console.log('  - Bump changed packages according to their own public/API behavior.')
  console.log('  - Do not mechanically copy patch/minor/major to downstream packages.')
  console.log('  - If a downstream package only needs its internal dependency metadata updated, patch is usually enough.')
  console.log('  - If a downstream package exposes new behavior or a breaking change, choose minor or major manually.')
}

function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  const { packages, byName, byDir } = loadPackages()
  const { directDependents } = buildInternalDependencyGraph(packages, byName)
  const changedFiles = getChangedFiles(args.since)
  const changedPackages = getChangedPackages(changedFiles, byDir)
  const directImpacted = collectDirectDependents(changedPackages, directDependents)
  const transitiveImpacted = collectTransitiveDependents(changedPackages, directDependents)

  printReport({
    since: args.since,
    changedFiles,
    changedPackages,
    directImpacted,
    transitiveImpacted,
    directDependents
  })
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
