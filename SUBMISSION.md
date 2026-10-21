# Submission checklist

> Kabla — Track 4 (BASIX.MARKET Builds), Brief B (Art IP and Music IP), stage: **License**.
> Items are ticked by the team as they are verified. The agent may report status but never submits.

Work through this list before the team submits on BASIX.MARKET. The deadline is Wed 21 Oct; the exact time is set at launch. Times are EAT (UTC+3).

## Registration

- [ ] Every team member has a BASIX.MARKET profile with an institution.
- [ ] The track and challenge are recorded in `README.md`.

## Work

- [ ] Builders: the repo is shared with BASIX.MARKET and the commit history shows the team's work.
- [ ] Creators: the finished piece is ready to show, with its process documented.
- [ ] The project stays within the track's scope.

## Documentation

- [ ] `README.md` covers what it does, setup steps, how to run it, how to test it, and team members.
- [ ] Setup steps were tested on a clean clone of the repo.
- [ ] `AI_DISCLOSURE.md` lists every AI tool used and what it was used for.
- [ ] Creators: the artist statement is written and includes AI disclosure.

## Safety and rights

- [ ] No secrets, API keys, or personal data are committed.
- [ ] Any partner or rights-holder data is used with documented permission. Placeholder data is labelled.
- [ ] Anyone shown on camera has consented to filming, and that consent covers publishing.
- [ ] Any reused code or assets are credited, and their licences are kept.

## Video

- [ ] A 3-minute video shows the project working.
- [ ] The video says what the team would build next.
- [ ] Creators: the 3-minute process video shows the making of the piece.

## Submit

- [ ] Submitted on BASIX.MARKET before the deadline.
- [ ] A video upload that is already running when the deadline passes gets 10 extra minutes. Don't rely on this.

## Agent status report (2026-10-21)

The agent does **not** submit and has **not pushed**. Human pushes and submits on BASIX.MARKET.

| Item | Status |
|---|---|
| Track and challenge recorded in README | **passed** (Track 4 / Brief B / License) |
| Scope is License stage | **passed with a flag**: the build is License **plus a Protect-lite Before step** (self-declared onboarding) because the team asked for it. README and `docs/DECISIONS.md` say so. Team to confirm they are happy to be judged on that. Update 2026-10-21: the student chose "Reorder" in chat, so the Before stage now leads the journey (You, Register your work, Your work passport, then Desk, Clause map, Simulator, Theater, Sign check, Licence desk, Financier, Verify); no track or challenge change. Audience numbers are self-reported and unverified; no NFT or chain is claimed |
| README: what, setup, run, test, team | **passed** (README "Honest status" updated) |
| Setup tested on a clean clone | **passed** for commit d9640f6: `tasks.py setup`, then `tasks.py test` (76 MeTTa checks, 59 API tests, web build green). The one-shot `verify` wrapper died between the two steps on this machine, so they were run separately. Later commits only change docs and the contract sketch |
| AI_DISCLOSURE.md kept | **passed** |
| Artist statement | **not applicable** (builders track, not creators) |
| No secrets committed | **passed** (`.env` git-ignored, keys only in `.env.example` as names; the agent never read `.env`). Re-run a scan before you push |
| Partner data | **passed** (SYNTHETIC only; placeholders labelled) |
| Filming consent | **not applicable** until a human records the video. Anyone filmed must agree to filming and publishing |
| Reused code credited | **passed** (NOTICE; Omega is Apache-2.0 and is run, not copied into the repo) |
| Claims about Omega | **passed with limits**: an Omega agent loop ran with Kabla's plugin (`docs/evidence/`); chat ran live with Nemotron 3 Super (5 of 5 turns) but the model only **phrases** skill results (a router picks the skill), and there is no Landlock sandbox. Do not say "built on Omega" |
| Public demo URL works | **passed** 2026-10-21: https://kabla-desk.fly.dev answers, browser check 13/13 against it (`docs/evidence/e2e-fly.md`). It sleeps when idle (first load ~10 s), has no Omega agent and no API keys. Re-check it right before you submit |
| 3-minute video | **failed** (script ready; human records; `scripts/record_checklist.md`) |
| Video says what's next | **not applicable** until recorded (`docs/NEXT.md` is the source) |
| Submitted on BASIX.MARKET | **failed** (human only) |
| Team BASIX profiles | **not applicable** (human) |
| Swahili copy reviewed by a fluent speaker | **failed** (AI-drafted; needs a reviewer, see LIMITATIONS.md) |
