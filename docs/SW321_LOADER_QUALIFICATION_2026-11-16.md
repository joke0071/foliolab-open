# SW321 loader measurement qualification · 16 November 2026

Product main: `29f2a1c85a6b859c75c0811b3b478f745b12c8bf`, tree `09419f00ebbd942fbb843a82b4c224212a2b2fdf`, SW321. Current test-only PR347 head: `da9b6455036d97ebbfeb13b2c0b63d32e2ed40cd`. Shipped assets are byte-identical. SW320 remains the last accepted release until the merge decision and release bookkeeping are complete.

## Original evidence and what it proves

| Original job / ZIP | CSS response after app request | startup.js response after app request | Assertion and later observation |
| --- | ---: | ---: | --- |
| 133376714554 / 14239831727 | 196ms | 410ms | Original line22 returned false; no assertion-time DOM/computed style |
| 133422057751 / 14244040918 | 181ms | 182ms | Original line22 returned false; teardown510ms after app request still visibility:hidden and layout inert |

The original450ms wait starts when the app.js route is intercepted. `styles.css` defines `visibility:hidden;animation:startup-show 0s .3s forwards`: this is a300ms delay followed by a zero-duration visibility change, not300ms of fading. CSS response headers do not establish body completion, parsing, style application, animation creation or animation start. Even the earliest original check leaves only254/269ms after CSS headers; the exact check times and animation start times were not captured. A later teardown snapshot cannot be substituted for the original check. Both originals remain failed executions. These two originals alone do not prove the loader missed its CSS-relative deadline or establish the complete cause.

An additional already-started original-only diagnostic run43904261067/job133428743095/ZIP14246155298 returned false again. Its failure-only snapshot, taken AFTER the false result, records startup-show currentTime241ms, delay300ms, running, visibility:hidden, layout inert. This directly demonstrates a premature observation before the CSS reveal deadline in that occurrence. The separate native/installed-clock diagnostic43903462738 showed successful visibility and completion with either clock; it does not prove a universal clock defect or retroactively pass any failed original.

## Smallest correction and counterprobe

PR347 changes only two test files. It waits for the existing startup-show animation to exist and its ready promise, then keeps the original450ms window and immediate isVisible assertion. It does not wait for visibility. Product/startup/storage/CSS files and browser pins are unchanged. All other original loading/PWA assertions remain in place.

The separate controlled counterprobe holds actual CSS until the old450ms timer expires. Only its early diagnostic observation freezes animation time0 for repeatability, then resumes the animation before the corrected measurement. This pause is never applied to the acceptance context. The real stylesheet subsequently passes; changing only the final keyframe to visibility:hidden still fails the original visibility assertion. The intentional CSS mutation is explicitly a negative control, not an original production result.

Actual-origin qualification43904770625/job133430549122/ZIP14246180686 passed the complete loading/PWA script with both controls: old timer451ms/early false/anchored true, and hidden-keyframe mutant451ms/early false/anchored false. QA head a7a7df69540d01545a0833d7cfb3c606e48fb8c5 has exactly the PR347 tests and released product assets; its extra workflow is not part of the two-file PR. Initial QA setup run43904564470 never executed a browser gate because shallow checkout lacked the release ancestor; the fetch was corrected. That setup run remains a failure.

## Coverage and decision boundary

Exactly55 unique engine/gate assignments: Chromium19, Firefox18, WebKit18. Of these,54 are unchanged successful original executions; one is the explicitly labeled corrected WebKit loading measurement. No successful original receipt is replaced by a repeat. All nine original filter/ring/combined reports pass. All three combined oracles are total1000EUR, shares40/30/29.9/0.1%, threshold2EUR, one journal and one booking; selection restoration and exact canonical raw/revision/settings/journal/bookings/quantities invariance pass.

Do not label the failed regular main workflow successful. Do not claim55 unchanged original tests passed. Do not merge the checkpoint branch wholesale. PR347 requires the user's concrete exact-head merge decision. Physical-device and private financial gates remain deferred outside this task.


## Counterprobe correction after the initial qualification

Initial proposed head72d430cb is superseded by current head `da9b6455036d97ebbfeb13b2c0b63d32e2ed40cd`. The initial controlled counterprobe itself deadlocked Chromium: with CSS held, the parser stops at the preceding classic startup.js script and never reaches the app.js module tag. A bounded10000ms local original-pin Chromium probe observed only stylesheet/startup requests, readyState loading, and only drive-backup/startup script elements. This is a test-harness defect, not a product defect. Prior regular CI43904550631 was cancelled after all3cross jobs passed; its Chromium test never completed and it is not a full PASS.

Current helper releases CSS before awaiting app.js and bounds both handshakes at30000ms. Local original-pin Chromium now passes both controls (real visibility true, mutant false). The complete acceptance entry point browser-loading-pwa.mjs and waitForStartupRevealWindow function are byte-identical between72d430cb andda9b6455, so the previously completed actual-origin WebKit acceptance measurement remains valid and is counted once. Current counterprobe is separately requalified in all3original browser pins; regular current-head CI43909694363 remains required before the merge decision. Saved archiveversion0 contains the earlier proposed head and is awaiting a guarded replacement with the final-head additions.


Final-head focused counterprobe43909800100 completed SUCCESS in all3original browser pins (jobs133448288416 Chromium,133448287757 Firefox,133448288470 WebKit). Real CSS visible=true and hidden-keyframe visible=false in each report. Saved archiveversion1 pinnedfile_00000000bdbc81f59e7ff6b73d698bf6/SHA2566e3d274acde30496817cd901c42e4e50f6b50c1ae87364cdc2a8a2e1365375a9 was actually fetched and independently restored:29ZIPs/2463original files/70manifest entries/55unique mappings/9contracts and154unchanged product paths verified. Final current CI and current synthetic merge metadata will be appended in the final archive revision before the merge decision.
