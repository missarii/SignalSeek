# Known limitations (honest, not hidden)

1. Claim extraction is sentence-level + heuristic (no NLI model by default) — may miss nuance; full passages retained for review.
2. PDF export is minimal text layout (valid PDF, no rich styling) — HTML/Markdown are the rich formats.
3. Monitor scheduling is interval/polling-based, not real-time; duplicate-schedule guards on restart are in place but email alerts are provider-optional (in-app first).
4. Embeddings default to a hash-based local stand-in (`EMBEDDING_DIMENSIONS` configurable); wire your embedding model before claiming semantic recall numbers.
5. Entity resolution is normalized-name based; people/orgs sharing a name are never auto-merged — review the graph panel.
6. Playwright rendering is not in the default path (fetch-only) — JS-heavy pages may extract poorly; marked as extraction failures, not silently filled.
