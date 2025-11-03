# Git Branching Strategy for Multi-Stage Refactor

## 🌳 Branch Structure

```
main (protected)
  ↓
refactor/integration (long-lived, base for all stages)
  ├── refactor/stage-1 ✅ (MERGED)
  ├── refactor/stage-2 (in progress)
  ├── refactor/stage-3 (future)
  ├── refactor/stage-4 (future)
  └── refactor/stage-5 (future)
```

## 📋 Workflow Overview

### Phase 1: Setup (COMPLETE ✅)

1. ✅ Create `refactor/integration` from latest `main`
2. ✅ Commit Stage 1 changes to `refactor/integration`
3. ✅ Push `refactor/integration` to remote

### Phase 2: Each Stage (Repeat for Stages 2-5)

1. **Create stage branch** from `refactor/integration`:

   ```bash
   git checkout refactor/integration
   git pull origin refactor/integration
   git checkout -b refactor/stage-N
   ```

2. **Implement stage with small commits**:

   ```bash
   git add <files>
   git commit -m "Stage N: <specific change>"
   # Repeat for each logical unit of work
   ```

3. **Ensure quality before PR**:

   ```bash
   npm run lint           # Must pass
   npm run format         # Auto-fix formatting
   npm run build          # Must build successfully
   npm run test           # Must pass (when tests exist)
   ```

4. **Push and open Draft PR**:

   ```bash
   git push origin refactor/stage-N
   # On GitHub: Open Draft PR targeting refactor/integration (NOT main)
   ```

5. **Iterate until green**:
   - Fix any issues
   - Commit fixes with clear messages
   - Push updates

6. **Mark PR as Ready & Merge**:
   - Remove Draft status
   - Merge `refactor/stage-N` → `refactor/integration`
   - Delete `refactor/stage-N` branch

7. **Update integration branch locally**:
   ```bash
   git checkout refactor/integration
   git pull origin refactor/integration
   ```

### Phase 3: Rebase if Needed

If `refactor/integration` diverges while working on a stage:

```bash
git checkout refactor/stage-N
git fetch origin
git rebase origin/refactor/integration
# Resolve conflicts if any
git push --force-with-lease origin refactor/stage-N
```

### Phase 4: Final Merge to Main

After ALL stages complete:

```bash
# Ensure integration is up to date
git checkout refactor/integration
git pull origin refactor/integration

# Final quality checks
npm run lint
npm run build
npm run test

# Open PR to main
git push origin refactor/integration
# On GitHub: Open PR targeting main
# Title: "Multi-stage refactor: Clean architecture & consolidated schema"
# Body: Link to all stage PRs, summarize changes
```

---

## 🎯 Current Status

### ✅ Completed

- [x] Create `refactor/integration` branch
- [x] Stage 1: Guardrails & Inventory
  - Commit: `1a1ae55`
  - Files: 18 changed, 5828+ insertions
  - Status: Ready to push

### 🔄 Next Steps

1. Push `refactor/integration` to remote
2. Create `refactor/stage-2` for next phase
3. Implement Stage 2 changes
4. Open Draft PR for Stage 2

---

## 📝 Commit Message Conventions

### Format:

```
Stage N: <Summary>

- <Change 1>
- <Change 2>
- <Change 3>

<Optional detailed explanation>
```

### Examples:

**Good:**

```
Stage 2: Extract shared hooks and consolidate schema

- Create useApi, useAuth, useQueue hooks
- Consolidate schema.sql from v2schema + migrations
- Update components to use shared hooks
- Remove duplicate fetch patterns in 15 files

Reduces code duplication by ~20% and establishes single source of truth for database schema.
```

**Bad:**

```
WIP

- various changes
```

---

## 🚨 Important Rules

### ❌ DO NOT:

- Merge stage branches directly to `main`
- Push directly to `refactor/integration` (use stage branches)
- Force push to `refactor/integration` without coordination
- Skip lint/build checks before merging
- Create stage branches from `main` (always from `refactor/integration`)

### ✅ DO:

- Always create stage branches from `refactor/integration`
- Keep commits small and focused
- Run lint/build/tests before every PR
- Use Draft PRs until ready for review
- Rebase stage branches if `refactor/integration` advances
- Squash commits when merging stage PRs (optional)

---

## 🔍 PR Template for Stage Branches

**Title:**

```
Stage N: <Descriptive title>
```

**Body:**

```markdown
## Stage N: <Title>

### Changes

- [ ] Change 1
- [ ] Change 2
- [ ] Change 3

### Quality Checks

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (if tests exist)
- [ ] No behavior changes (or documented if intentional)

### Related

- Part of multi-stage refactor
- Follows refactor-map.md recommendations
- Based on db/usage-manifest.json analysis

### Testing

- [ ] Manual testing completed
- [ ] No regressions observed

### Notes

<Any additional context, risks, or decisions>
```

---

## 📊 Stage Progress Tracking

| Stage | Branch                 | Status      | PR  | Merged | Notes                        |
| ----- | ---------------------- | ----------- | --- | ------ | ---------------------------- |
| 1     | `refactor/integration` | ✅ Complete | N/A | N/A    | Base commit on integration   |
| 2     | `refactor/stage-2`     | 📝 Planned  | -   | -      | Hooks + Schema consolidation |
| 3     | `refactor/stage-3`     | 📝 Planned  | -   | -      | Component extraction         |
| 4     | `refactor/stage-4`     | 📝 Planned  | -   | -      | Service standardization      |
| 5     | `refactor/stage-5`     | 📝 Planned  | -   | -      | Testing + final cleanup      |

---

## 🎯 Benefits of This Strategy

1. **Isolated Work**: Each stage is independent
2. **Safe Experimentation**: Can abandon stage branch if needed
3. **Easy Review**: Small, focused PRs per stage
4. **Continuous Integration**: `refactor/integration` always buildable
5. **Single Main Merge**: Clean Git history, one final review
6. **Rollback Safety**: Can revert integration branch if needed
7. **Team Coordination**: Draft PRs show work in progress

---

## 🚀 Quick Commands Reference

```bash
# Start new stage
git checkout refactor/integration && git pull
git checkout -b refactor/stage-N

# Work on stage
git add <files>
git commit -m "Stage N: <change>"
npm run lint && npm run build

# Push and open PR
git push origin refactor/stage-N
# Open Draft PR on GitHub → target: refactor/integration

# After PR approved
# Merge on GitHub, then:
git checkout refactor/integration
git pull origin refactor/integration
git branch -d refactor/stage-N

# Final merge (after ALL stages)
# Open PR: refactor/integration → main
# Review, approve, merge on GitHub
```

---

**Strategy Active** ✅  
**Current Branch**: `refactor/integration`  
**Next**: Push to remote and create Stage 2 branch
