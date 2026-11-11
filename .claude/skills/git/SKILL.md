---
name: git
description: Branch naming and PR rules for this repo. Use whenever creating a branch, committing, pushing, or opening a pull request — including when another skill (git-publish, pr-splitter, ship-plan) is about to create a branch.
---

# Git

- **Branch names** are `ryan/` plus the feature name in kebab-case, 2–3 words: `ryan/auth-agent-role`, `ryan/list-pagination`.
- **`main` is protected.** Never commit or push to it directly. Create a new branch, push it, and open a pull request.
