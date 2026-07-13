# Branch and Worktree Policy

## Repository role

- This is the static Astro marketing site only.
- Customer features belong to `fiducia-customer.rs`; operator features belong to
  `fiducia-admin.rs`.
- Do not add login, customer account, API-key, or admin workflows here.

- Work directly on the `main` branch for now.
- Before making changes, confirm that `main` is the checked-out branch.
- Do not create or use feature branches.
- Do not create or use Git worktrees.
- Merge any existing non-`main` branch into `main` with an intent-preserving merge, resolve conflicts semantically, and continue work on `main`.
- Push completed work to `origin/main`.
- Preserve existing uncommitted work and stop for operator guidance if moving to
  `main` cannot be done safely.
