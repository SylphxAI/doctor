---
"sylphx-doctor": minor
---

Improve check structure and add missing checks

New Features:
- Auto-detect monorepo vs single-package repos
- Hide skipped checks from output for cleaner reports
- Smart turbo.json detection (validate if exists, only require for monorepos)

New Checks:
- `files/gitignore` - Check .gitignore exists (auto-fix supported)
- `files/changelog` - Check CHANGELOG.md exists
- `pkg/repository` - Check package.json has repository field
- `pkg/keywords` - Check package.json has keywords

Improvements:
- Monorepo section hidden when not applicable
- Refactored monorepo checks with helper functions
- All checks now have access to `ctx.isMonorepo` for conditional logic
