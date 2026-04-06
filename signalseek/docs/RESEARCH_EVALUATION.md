# Research evaluation

Benchmark: `scripts/benchmark.md` — 6 representative questions with expected sources/claims/criteria.

Metrics: Recall@k, Precision@k/nDCG@k, citation correctness (% `[Sn]` resolving to persisted sources), claim→evidence support rate, subquestion coverage, contradiction precision/recall on labeled pairs, latency, search calls, tokens/cost.

Method: run bounded agent vs single-round search-and-summarize baseline on identical providers; report per-question tables + limitations (small sample, demo-provider bias, no human grading yet). No superiority claims without measured evidence.
