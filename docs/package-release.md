# Package Release Flow

This document describes how to prepare and publish packages under `packages/`.
It uses Changesets for versioning and publishing, and uses the local impact script
to decide which related packages need review before release.

> Note: the root `README.md` still describes an application-tag release model.
> Use this flow only when the team is intentionally publishing npm packages from
> `packages/`.

## 1. Check Changed Packages

For current worktree changes:

```sh
pnpm affected:packages
```

For a branch-level release check against `main`:

```sh
pnpm affected:packages -- --since main
```

The script reports:

- packages changed under `packages/`
- direct dependents to check
- transitive dependents to consider
- changed files used for the report

Use the output as the review checklist. Direct dependents are the first packages
to inspect. For low-level contract packages, also inspect transitive dependents.

## 2. Decide Version Bumps

Do not mechanically copy the upstream package's `patch`, `minor`, or `major` bump
to downstream packages. Choose each package's bump based on that package's own
public API and behavior.

| Change type | Bump |
| --- | --- |
| Bug fix, internal implementation change, dependency metadata update | `patch` |
| Backward-compatible public API or behavior addition | `minor` |
| Breaking public API or behavior change | `major` |

Downstream packages usually need a release only when one of these is true:

- their code changed
- their public API or behavior changed
- their published package metadata should move forward with an internal dependency update
- they need compatibility work for an upstream change

`wallet-background` has broad `peerDependencies`, so treat service or shared
contract changes as integration-impacting and test it when the script reports it.

## 3. Add Changesets

Create a changeset:

```sh
pnpm changeset
```

Select every package that should be published and choose the correct bump for
each one. The generated file in `.changeset/` should explain the user-facing or
package-consumer-facing reason for the release.

For dependency-only downstream releases, use `patch` unless that downstream
package also exposes new or breaking behavior.

Changesets is configured with:

```json
"updateInternalDependencies": "patch"
```

That means packages included in the same changeset can receive patch-level
internal dependency updates when needed.

## 4. Verify Before Versioning

Run focused checks for the changed and affected packages. For broad package
changes, run the workspace-level checks:

```sh
pnpm -r typecheck
pnpm -r test
pnpm build
```

If a package has special build behavior, run its package script directly. For
example, `wallet-bitcoin` uses `build:all` in `prepublishOnly`.

## 5. Apply Versions

After changesets are reviewed and checks pass, apply package versions and
changelogs:

```sh
pnpm changeset version
```

Review the generated changes before committing:

```sh
git diff
```

This step updates package versions, internal dependency ranges when needed, and
package changelogs.

## 6. Publish Packages

Before publishing, make sure npm auth and registry are correct:

```sh
npm whoami
npm config get registry
```

Publish the packages selected by Changesets:

```sh
pnpm changeset publish
```

Each package's `prepublishOnly` script will run during publish. Most packages run
their own clean, test, and build steps before publishing.

## 7. After Publish

After publish succeeds:

1. Commit the version/changelog changes if they were not already committed.
2. Push the release commit and tags according to the team's release policy.
3. Verify the published versions on npm.
4. Share the package names and versions that were published.

