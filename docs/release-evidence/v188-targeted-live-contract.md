# v188: additional targeted live gate

Production release ca1fa8fd46b3060d10a13095400bc3d33b0f3c42, approved PR173 head c73df569ede16d13bffb939983328e143cc6db4b, application tree d400d1087c18af1c24b65c498414cfe70f57dcbf.

This QA branch changes no application assets and has no merge or deployment purpose. The existing main workflow still performs every mandatory unit/browser/Pages/core-live gate. An additional push-only QA workflow runs the already existing booking-management, position-archive and position-removal scenarios against the actual published custom domain in three engines, isolated synthetic contexts only. The booking harness accepts a base URL; all financial, storage, identity, preview, quota, abort, stale-CAS, undo, restore, offline and accessibility assertions remain unchanged. No private originals, wallet identifiers or keys are used. Source tree and published target bytes must match the approved release before any scenario runs.

This is release acceptance, not the later CI optimization package. No existing main workflow, test or mandatory gate is removed, skipped or weakened. Results remain pending until the workflow actually passes; a green PR CI alone does not complete v188.
