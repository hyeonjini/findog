# Code Review Workflow (Codex + Human)

Applies to every PR in the repository. This document defines how automated reviews from Codex (or any AI reviewer) and human reviews are handled to maintain code quality and a traceable conversation trail.

---

## 1. Trigger

Codex reviews are triggered automatically when:
- A pull request is opened for review.
- A draft PR is marked as ready.
- A contributor comments `@codex review`.

---

## 2. Review Evaluation

Every Codex comment must be explicitly evaluated before the PR can be merged.

### 2.1 Classification

| Label | Criteria | Action |
|---|---|---|
| **Valid** | Points to a real bug, security gap, or architectural violation backed by code evidence | Fix it, push, reply with resolution details |
| **Partially valid** | Core observation is correct but the suggested fix is wrong or excessive | Fix the real issue your way, reply explaining what you changed and why the suggestion was adjusted |
| **Invalid** | Incorrect analysis, false positive, or stylistic preference that contradicts project conventions | Reply explaining why the comment is not applicable, cite evidence (code, docs, or convention) |

### 2.2 Priority Mapping

Codex assigns its own priority badges. Map them to action urgency:

| Codex Badge | Our Urgency | Merge Blocker? |
|---|---|---|
| P1 (orange) | Must fix before merge | Yes |
| P2 (yellow) | Should fix in same PR if scope allows | Yes, unless explicitly deferred with justification |
| P3 (blue) | Nice to have | No — can be deferred to follow-up issue |

---

## 3. Response Format

Every Codex inline comment must receive a threaded reply. Use this structure:

```markdown
Addressed in <commit-sha>.  (or: "Not applicable — see explanation below.")

**Changes applied:**
- <bullet list of what changed and where>

**Test coverage added:**
- <bullet list of new/updated tests>

All <N> tests pass.
```

If the comment is **invalid**, use:

```markdown
Not applicable.

**Reason:** <concise explanation with code/doc references>
```

---

## 4. Step-by-Step Workflow

```
1. PR is created or updated
        │
2. Codex posts review comments (automatic)
        │
3. Developer reads each comment
        │
4. For each comment:
   ├─ Valid?       → Fix in code, add tests, push, reply with resolution
   ├─ Partial?     → Fix the real issue, reply explaining adjustment
   └─ Invalid?     → Reply with explanation and evidence
        │
5. All comments have threaded replies
        │
6. Push fix commit(s) referencing the review
        │
7. Verify: tests pass, diagnostics clean, build green
        │
8. Request human review (minimum 1 approval required)
        │
9. Merge to develop
```

Review fixes stay on the original PR branch. Do not open a separate `fix/*` branch just to respond to review feedback unless the user explicitly asks for a separate follow-up PR.

---

## 5. Commit Convention for Review Fixes

Use `fix(<scope>):` prefix for commits that address review feedback:

```
fix(backend): address PR review — <brief summary>

- <change 1>
- <change 2>
- <test additions>
```

If a single review round produces multiple unrelated fixes, prefer one commit per logical change over one giant commit.

Recommended body sentence for review-fix commits:

```markdown
Reason: address valid PR feedback before merge to develop.
```

---

## 6. Rules

1. **Never ignore a review comment.** Every comment gets a reply — even if the reply is "not applicable."
2. **Never merge with unresolved threads.** All Codex (and human) review threads must have a response before merge.
3. **Evidence over opinion.** When disagreeing with a comment, cite code, tests, documentation, or RFCs — not feelings.
4. **Minimize scope creep.** If a review comment reveals a larger issue outside the PR's scope, create a follow-up issue and link it in the reply.
5. **Re-run verification after every fix push.** Diagnostics, tests, and build must pass after addressing review comments.
6. **Human reviewer has final authority.** Codex comments inform the review but do not replace human judgment. If a human reviewer disagrees with Codex, the human decision takes precedence.
7. **User-shared review comments are first-class review input.** If the user pastes a comment or shares a review URL, handle it with the same classify-fix-verify-reply loop.
