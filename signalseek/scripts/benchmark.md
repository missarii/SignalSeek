# Benchmark (agent vs single-round baseline)

| # | Question | Expected signals | Key claims to support |
|---|----------|------------------|-----------------------|
| 1 | Open RAN adoption in Europe | demo dataset + briefing | 41% global scope vs 27% EU scope (different-scope, not genuine) |
| 2 | EV battery cost trend 2020–2024 | figures w/ dates | date-scoped figures must not be flattened |
| 3 | SEC filing revenue restatement | primary filing vs press | primary source outranks secondary on provenance display |
| 4 | City water-quality incident timeline | event ordering | timeline section ordered, dated, cited |
| 5 | Contradictory trial results | two scoped studies | contradiction recorded with both sides + evidence |
| 6 | Gap case (unanswerable subquestion) | partial coverage | "insufficient evidence" stated; follow-ups issued within budget |

Run: `scripts/run_benchmark.sh` (agent via `/run` in demo mode; baseline = 1 query → top-5 → summarize).
Record: Recall@5, citation correctness, support rate, coverage, contradiction P/R, latency, #search calls, tokens/cost.
Limits: n=6, demo-provider content, automated checks only — treat as regression signal, not proof of superiority.
