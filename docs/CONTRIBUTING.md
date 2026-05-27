# Contributing to SecureShop

## Branch Strategy — Enterprise GitFlow

### Branch Types

| Branch | Purpose | Base | Merges Into |
|--------|---------|------|-------------|
| `main` | Production | — | — |
| `develop` | Integration | `main` | — |
| `feature/*` | New work | `develop` | `develop` |
| `release/*` | Stabilization | `develop` | `main` + `develop` |
| `hotfix/*` | Emergency fix | `main` | `main` + `develop` |

### Workflow for New Features

```bash
# 1. Always branch from develop
git checkout develop && git pull origin develop
git checkout -b feature/your-feature-name

# 2. Work, commit often with signed commits
git add . && git commit -m "feat: describe what you did"

# 3. Push and open PR targeting develop
git push origin feature/your-feature-name
gh pr create --base develop --title "feat: your feature" --body "Description"

# 4. After approval and merge — delete the feature branch
git branch -d feature/your-feature-name
```

### Commit Message Convention

Format: `<type>: <description>`

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Build, config, tooling |
| `docs` | Documentation only |
| `security` | Security fix or hardening |
| `ci` | CI/CD pipeline changes |
| `test` | Test additions or fixes |

All commits must be GPG signed. Unsigned commits will be rejected.
