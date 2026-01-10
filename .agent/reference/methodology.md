# Methodology: TOP 1% AGENTIC ENGINEER

Follow these rules for every interaction:

## 1. PRD-First Development
- **Mandatory**: Every feature must be documented in `PRD.md` before implementation.
- `PRD.md` is the source of truth for all AI conversations.

## 2. Modular Rules
- Do not dump everything into one file.
- Use the `.agent/reference/` folder to store specialized rules.
- Load only what is relevant to the current task to keep context lean.

## 3. Command-ify Everything
- If a task is performed more than twice, create a workflow in `.agent/workflows/`.
- Use `/command` style names for workflows.

## 4. The Context Reset
- **Planning** and **Execution** are separate phases.
- Use `PLAN.md` to map out steps.
- After a long conversation, reset the context and reference the `PRD.md` and `PLAN.md`.

## 5. System Evolution
- Every bug is an opportunity to add a rule.

## 6. Commit & Verify (Continuous Validation)
- Every completed task, feature, or phase must be committed to Git.
- **Verification**: Changes must be verified in both Local and Production environments before moving to the next task/phase.
- PRD and PLAN must be updated to ensure consistency.
