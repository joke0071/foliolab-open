# PR349 Main: original dependency installation failure and one targeted restart

Pinned main494ed8f0f6b627d8be972a5ceb886005e5064b31; approved PR349 already merged, product/SW321 unchanged. Run43956969224 attempt1 completed FAILURE. No test assertion, deadline, browser pin, product code or workflow changed for the restart.

| Fact | Failed Cross2 | Successful Cross1 |
|---|---|---|
| Original job |133614229345|133614229433|
| Ubuntu image |ubuntu-24.04 /20261111.127.1|ubuntu-24.04 /20261111.370.1|
| Provisioner |20261103.629|20261103.629|
| Playwright |1.64.1|1.64.1|
| Installation step |21:09:13Z–21:09:23Z, FAILURE|21:08:58Z–21:09:38Z, SUCCESS|
| Package metadata |Only packages.microsoft.com noble indexes fetched;1478kB|Ubuntu noble/noble-updates/backports/security plus Microsoft;13.1MB|
| Package result |Many Ubuntu packages missing/no candidates; installer exit100|Ubuntu dependencies installed; Firefox/WebKit tests passed|
| Portfolio test step |SKIPPED|SUCCESS|

Failure is at OS package installation, before the relocated UI-quality or any Cross2 browser suite. Missing candidates include libavcodec60, fonts-unifont, gstreamer packages, libgtk-4-1, libsecret-1-0 and others. No recorded Ubuntu repository HTTP429/503, package signature failure or browser assertion establishes a product defect here. The logs establish missing Ubuntu package availability/index coverage in that runner environment; exact /etc/apt source configuration and why Ubuntu entries were absent are not captured. An image-specific setup issue is plausible, not proven solely by different image numbers. Same pinned code passed on the concurrent370.1 image; one fresh-runner retry is justified. On repeated installation failure, capture/compare source configuration and APT policy before another run; no blind retry chain.

Original artifact14271463119,298554bytes,SHA256aa2f8bb13a20fb2c9e168aec4af3fdf7a2bdf9b1f20ba23f961ea2b6a9f7cfab, full CRC PASS. It contains exact flh03-browser-install.log and six PNGs. All six PNGs equal tracked repository UI-visual01 blobs; they are not new successful Cross2 tests. Full decoded original failed job log and successful Cross1 log retained, together with original job/artifact metadata.

[Saved original failure/comparison package](https://chatgpt.com/library?file_id=libfile_fde3_f-84def5afe2f8819185ac9b5034d30b8a_54e45e8130348191808d9aaa710cf372&account_id=personal), version0,339865bytes,SHA256c1d3fffd229b0153a80244ddc623c19041dfae9c889cded2cead0079846c686c. Original inner ZIP retained byte-for-byte. No private portfolio or financial evidence.

## Retained jobs and restart

Attempt1 retained SUCCESS: test133614229212 (1121s), Cross1133614229433 (627s), Cross3133614229266 (905s). Failed Cross2 consumed38s total, installation10s; no Cross2 test runtime. Deploy/live correctly skipped. Attempt1 is not a complete successful integration timing sample.

After attempt1 ended, exactly one rerun-failed-jobs request accepted. Attempt2 actual new Cross2 job133627209482 started21:30:27Z. Its installation is now SUCCESS and browser workflows active. Copied successful jobs have new API IDs but unchanged original execution timestamps; do not count them as reruns or new runner work. Existing head and qualified PR evidence retained. No further run started.

PR measurement remains1076s versus1384/1396s, observed5.1–5.3min less wait on that comparison. Main must report separately: failed setup38s; unchanged successful job runtimes; restart scheduling/diagnosis gap; actual restarted job duration; wall time from initial integration start to complete accepted required jobs. Do not label that total as an uninterrupted18minute successful main phase or subtract infrastructure delay to manufacture an observed timing win. Final runtime and deployment/live results pending.


## Completed preservation and current retry installation

[Complete attempt1 original package](https://chatgpt.com/library?file_id=libfile_fde3_f-a7b5f88075348191a226d1a569f34f52_54e45e8130348191808d9aaa710cf372&account_id=personal), version0,153384960bytes,SHA256e4c32fd63be9d9bcd103afa3a5e96b2947879a78b69869d382cd53fc4a4ad7b3. Actual saved copy independently read back:17archive members/16manifest entries,6original ZIPs/1668ZIP members; all lengths/hashes/CRCs PASS. This includes all retained successful-job originals, not just the failed installation. Retained Cross1/Cross3/Chromium/Dialog report-path sets match the qualified PR after only the existing13digit storage-fixture filename timestamp normalization; no missing paths.

Retry job133627209482: installation21:30:43Z–21:31:46Z SUCCESS (63s), browser workflows now active. The first failed installation took10s, successful original Cross1 took40s. New runner image is to be read from the completed retry's original log; no guessed version. Original successful jobs stay reused. No further run or product/test change.
