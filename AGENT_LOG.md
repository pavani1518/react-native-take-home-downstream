# AGENT_LOG

Required by the spec (§"Agent Workflow Requirement"). Answers the eight questions in order.

## Which coding agents or AI tools did you use?

- **Claude Code (Opus 4.7)** in interactive mode for the entire implementation. Single agent, no sub-agents spawned for this task — the codebase was small enough that delegating would have added more orchestration overhead than it saved.

## What tasks did you delegate?

End-to-end implementation given a strict, doc-aligned plan:

1. Spec parse + scope audit (cut anything not in the doc; added items I'd missed).
2. Bootstrap Expo blank-typescript project with the deps the spec explicitly mentions.
3. Data model + deterministic seed (verbatim from §"Data Model").
4. Mocked async resource layer with tunable failure rate (so retry queue has work).
5. **Pure domain logic before any UI** — 10 functions per §13.
6. Jest tests for the 9 risk areas in §14.
7. Workboard screen + filter bar + summary header + site row.
8. Site detail sheet (Modal pageSheet, 8 fields per §3).
9. Visit detail sheet stacked inside site sheet (Modal pageSheet, 12 fields per §4).
10. Camera evidence capture inline panel with permission states + simulate fallback.
11. Barcode/QR scanner inline panel with manual dev fallback.
12. Accelerometer motion check inline panel + custom hook with subscription lifecycle.
13. Foreground location capture with degraded-on-denial path.
14. AsyncStorage retry queue with persistence helpers.
15. Analytics abstraction + 18 event call sites.
16. README + this AGENT_LOG.

## What prompts or instructions were most effective?

- **"Make sure we are exactly following the requirements as per document. No hallucination, no guesses."** This single instruction from the user reshaped the entire plan. It led to an explicit pre-implementation audit of "things I'm REMOVING" vs "things I'm ADDING" against the doc, with verbatim spec citations. Examples cut: `date-fns`, `@gorhom/bottom-sheet`, toast notifications, optimistic rollback (Optional Stretch), expo-haptics, five actions (the doc says "at least three"). Examples added: exact `Missing proof / Scan mismatch / Ready to complete` filter labels, `Linking.openSettings()` recovery, sensor-unavailable state for the accelerometer.
- **"Domain logic before UI."** Prevents the "UI-only implementation with no explicit domain logic" weak signal called out in the rubric. The 47 tests provided a quick safety net before any UI work.
- **"At each phase, end with `npm run typecheck`."** Caught the `noUncheckedIndexedAccess` issue in `seed.ts` (`pick(arr, i)` returning `T | undefined`) immediately rather than after building UI on top.

## Which generated outputs did you reject or rewrite?

1. **First pattern set** in `seed.ts` had only 2 visits per pattern, yielding 43 visits — below the ≥60 floor. Rewrote patterns to 3 visits each so 20 sites × 3 = 60 visits exactly.
2. **First plan offered 5 visit actions**. Cut to 3 + retry — the doc says "at least three". Over-committing burns timebox.
3. **First plan included optimistic updates with rollback**. That's an Optional Stretch per the doc, not core. Cut.
4. **Initial typings used `baseUrl + paths`**. TypeScript 6.0 deprecated `baseUrl`. Dropped `baseUrl` and used `paths` alone.
5. **Initial fix attempt for Jest type errors involved excluding test files from `tsc include`.** Switched to `types: ["jest", "node"]` instead so test files still get type-checked.
6. **First useMemo wiring in `WorkboardScreen`** depended on raw `query.data ?? []` expressions, which the React Hooks ESLint rule flagged because the array identity could change every render. Wrapped each in its own `useMemo`.

## What bugs did your review catch?

1. **`fixtures.ts` was being run as a Jest test** because it sat under `__tests__/` and Jest's default matcher picks up any TS file in that folder. Restricted `testMatch` to `**/*.test.ts(x)`.
2. **`evidence_upload_failed` was originally only fired inside the mocked `uploadEvidence`** API itself. Moved the call into the React Query mutation's `onError` (which also enqueues to the retry queue) so the analytics fires after the upload pipeline knows what to do with the failure.
3. **`getEligibleActions` could allow `complete_visit` from a `scheduled` visit** while motion was required and not yet captured. The `canComplete()` check correctly returned a `motion_missing` blocker; the bug would have been hiding the eligibility behind a UI conditional. Centralizing in `domain/eligibility.ts` fixed the structural issue (no scattered conditionals).
4. **Motion check window** initially had a timer but no `clearInterval` for the progress updater on unmount — would leak a setInterval if the visit sheet closed mid-check. Fixed via the `stop()` helper returned from the hook and called from the cleanup `useEffect`.
5. **Location denial was about to be a silent path** when capturing evidence. Added `Alert.alert` with a clear reason so denial is surfaced, per §9 "should not fail silently."

## What parts did you implement manually?

Manually means "wrote / shaped without asking the agent to generalize":

- The scope-audit comparison table (what to add vs cut).
- Pattern composition in `seed.ts` — picking which combinations cover overdue, blocked, cancelled, completed, and scan-mismatch in one deterministic dataset.
- The action eligibility / completion blocker model — designed first as pure data (`CompletionBlocker` union) before any UI consumed it.
- The two-modal-layer ceiling design decision: inline content swap inside the visit sheet rather than a third Modal.

## What tradeoffs did you make to stay within the timebox?

- **3 visit actions, not 5.** The doc says "at least three"; over-committing wastes time.
- **No image-snapshot testing.** Pure-logic tests cover the rubric's "highest-risk business logic"; UI correctness is verified manually.
- **No optional stretch features** of any kind.
- **`@testing-library/react-native` was dropped** due to peer-dep conflicts with the freshly-bootstrapped React 19 / RN 0.85 stack. Spec only requires Jest for pure logic — so this was an easy cut.
- **No backend** (per spec).
- **Console transport for analytics** (per spec — explicitly acceptable).
- **No screenshots committed** — captured via simulator at review time.

## What would you ask an agent to do next if you had another hour?

In priority order, each scoped tight enough to actually finish:

1. **Optimistic update + rollback** for `mark_en_route` and `report_blocked` (§Optional Stretch). The `useMutation` already gives the right hooks via `onMutate` + `onError`; the domain `nextStatus` function makes the optimistic payload easy.
2. **Group sites by Today / Next 7 / Later** in the FlatList using `SectionList`. Helps "feel like a field tool" per the rubric.
3. **Persist filter state across reloads** via AsyncStorage so a returning provider sees their last view.
4. **A short `useMotionCheck` test** that mocks the Expo Accelerometer subscription and verifies `start → addListener → setTimeout → removeListener` order, since the spec calls out "sensor subscriptions that stay active after leaving the screen" as a weak signal.
5. **One UI-state snapshot test** for `VisitDetailSheet` in each mode (details / capture / scan / motion / blocked-reason) using `react-test-renderer` to catch regressions in the inline-content swap.
6. **Background upload retry** when the app returns online (Optional Stretch) — NetInfo subscription + flush retry queue.
