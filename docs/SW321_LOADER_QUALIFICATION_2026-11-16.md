# SW321 loader measurement qualification · 16 November 2026

Product main: `29f2a1c85a6b859c75c0811b3b478f745b12c8bf`, tree `09419f00ebbd942fbb843a82b4c224212a2b2fdf`, SW321. Proposed test-only PR347 head: `72d430cbbc9f821a032d3dc0a11a8fb112555d39`. Shipped assets are byte-identical. SW320 remains the last accepted release until the merge decision and release bookkeeping are complete.

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
