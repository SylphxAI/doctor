---
"sylphx-doctor": minor
---

Auto-detect monorepo vs single-package repos

- Automatically detects if project is a monorepo (has `workspaces` in package.json or `packages/`/`apps/` directories)
- Skips turbo.json and turbo-pipeline checks for single-package repos
- Provides clearer messaging: "Not a monorepo, turbo.json not required"
- All checks now have access to `ctx.isMonorepo` for conditional logic
