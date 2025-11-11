# AGENTS.md

## Coding Principles & Methodology

- **Always use the DRY (Don't Repeat Yourself) approach when coding.**
- **Follow a Test-Driven Development (TDD) workflow.** When adding a new feature, the process must be:
    1.  **Red:** Write the failing test(s) first.
    2.  **Green:** Write the *absolute minimum* code required to make the test(s) pass.
    3.  **Refactor:** Clean up the new code, ensuring it follows all other style guides.

## Testing

- Run unit tests with `npm run test:unit`.
- All new code must be accompanied by corresponding tests.
- Do not modify existing tests to make your code pass; modify the code.