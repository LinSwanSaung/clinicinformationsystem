# Merge Instructions: refactor/stage-4-components → refactor/integration

## After PR Approval

1. **Switch to integration branch:**

   ```bash
   git checkout refactor/integration
   git pull origin refactor/integration
   ```

2. **Merge stage-4-components:**

   ```bash
   git merge refactor/stage-4-components --no-ff -m "Merge Stage 4: Componentization complete (20 items)"
   ```

3. **Push to remote:**

   ```bash
   git push origin refactor/integration
   ```

4. **Verify build:**
   ```bash
   cd frontend
   npm run build
   ```

## Alternative: Merge via GitHub UI

1. Mark PR as "Ready for Review" (if still Draft)
2. Get approval
3. Click "Merge pull request" → "Create a merge commit"
4. Confirm merge

---

## Current Status

- Branch: `refactor/stage-4-components`
- Target: `refactor/integration`
- All commits pushed: ✅
- Build: PASS ✅
- Ready for merge: ✅
