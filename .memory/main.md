# pi-token-burden — Roadmap

## Purpose

A pi-coding-agent extension that analyzes the system prompt's token budget,
breaking it down into sections (base prompt, AGENTS.md files, skills, metadata)
so the user can see where context window capacity is being spent.

## Current State

- v0.1.0 — functional `/token-burden` command
- Parses system prompt into sections using structural markers
- Token estimation via BPE tokenization (gpt-tokenizer, o200k_base encoding)
- Renders an interactive TUI overlay via `BudgetOverlay` (keyboard nav, drill-down, fuzzy search)
- Full test coverage (4 test files, 21 tests)
- Tooling: oxlint, oxfmt, TypeScript strict, Vitest, knip, jscpd, CI

## Architecture

- `src/index.ts` — Extension entry point, registers `/token-burden` command
- `src/parser.ts` — Splits the prompt into sections, extracts AGENTS.md and skill entries; `estimateTokens()`
- `src/report-view.ts` — `BudgetOverlay` class, ANSI rendering, keyboard input handling
- `src/utils.ts` — `fuzzyFilter()` for search, `buildBarSegments()` for bar chart
- `src/types.ts` — Shared types (ParsedPrompt, TableItem, PromptSection)

## Milestones

1. **Foundation** (done) — Parser, report view, utils, tests, CI
2. **Refinements** — Injected-skill tracking, richer visuals
3. **Actionable insights** — Suggest which skills/files to trim when budget is tight
