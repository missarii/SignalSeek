# Agent workflow

`START → analyze_question → create_research_plan → execute_searches → normalize_and_deduplicate
→ retrieve_relevant_content → extract_claims_and_entities → evaluate_evidence
→ identify_research_gaps → sufficient_evidence? ─no→ generate_followup_queries → execute_searches
                                          └yes→ synthesize_report → persist_report
→ update_knowledge_graph → emit_completion → END`

Plus error / cancellation / timeout / exhausted-budget exits at every step.

- **analyze_question**: validates length, decomposes into ≤5 subquestions + ≤maxQueries deduplicated queries.
- **execute_searches**: batches of 5/round, skips near-duplicate normalized queries, records provider + latency.
- **normalize_and_deduplicate**: canonical URLs (lowercased host, sorted query, tracking params stripped), sha256 content hashes.
- **retrieve**: SSRF guard (scheme/host/DNS→public-IP, redirect revalidation), 15s timeout, 2MB cap, content-type check, trafilatura→bs4→raw chain; failures marked `extraction_failed`, never fabricated.
- **extract**: overlapping chunks (1200 chars/200 overlap) with `chunk-N` locators; sentence-level claims ranked so figure-bearing sentences surface first; entities via capitalized-phrase extraction with normalized-name dedupe.
- **evaluate**: claim→passage→source links; statuses SUPPORTED/PARTIALLY/CONTRADICTED/INSUFFICIENT/NOT_EVALUATED.
- **contradictions**: numeric-figure pairing + classifier (genuine / different-reporting-dates / different-scope / different-definitions / opinion-difference / incomplete-information). Never auto-prefers newest/popular.
- **gaps**: subquestion keyword coverage → ≤2 follow-ups/round, bounded by maxRounds/maxQueries/maxSources/wall-clock.
- **synthesize**: consumes only persisted evidence; `[Sn]` keys validated against citations; unresolvable keys append an explicit caveat; insufficient-evidence stated outright.
- **checkpoints**: plan, rounds, queries, source IDs, events, token/cost estimates, errors, cancellation persisted per run; resume never duplicates reports/sources/edges (unique constraints + existence checks).
