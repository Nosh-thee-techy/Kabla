; ============================================================================
; Kabla engine — atom schema
; ----------------------------------------------------------------------------
; This file documents the shapes of the facts the API asserts for one request
; (written to a temporary facts.metta by api/kabla/services/metta_bridge.py),
; plus the shapes of the results the rules return. It defines no rules.
;
; PeTTa note (see docs/DECISIONS.md): a symbol with an `=` definition is a
; function everywhere. Result constructors below (flag, verdict, move, ...)
; are therefore never used as function names.
; ============================================================================

; ── contract and parties ───────────────────────────────────────────────────
; (contract <cid>)
; (contract-kind <cid> recording|publishing|distribution)
; (party <cid> label|artist <String>)
; (contract-artist <cid> <artist-id>)        ; whose red lines apply

; ── clause facts (from extraction: LLM in live mode, fixture otherwise) ────
; (clause <cid> <n> grant <right> <duration> <territory> <exclusivity>)
;     right: master|composition|artwork  duration: perpetual|term-limited
;     territory: worldwide|africa|east-africa|kenya  exclusivity: exclusive|non-exclusive
; (clause <cid> <n> term <years:Number>|perpetual)
; (clause <cid> <n> ai-training granted no-opt-in|vague|opt-in-paid|prohibited)
;     (written as (clause c n ai-training granted no-opt-in), (clause c n ai-training vague), ...)
; (clause <cid> <n> voice-likeness granted synthetic-voice|promo-only)
; (clause <cid> <n> royalty <percent:Number> recoupable|non-recoupable)
; (clause <cid> <n> advance <amount:Number>)
; (clause <cid> <n> reversion none|<after-years:Number>)
; (clause <cid> <n> cross-collateral yes|no)
; (clause <cid> <n> option-periods <count:Number> label-only|mutual)
; (clause <cid> <n> audit yes|none)
; (clause <cid> <n> sync-approval label-only|artist-approval)
; (clause <cid> <n> splits stated <total:Number>)  |  (clause <cid> <n> splits not-stated)

; ── artist standing rules (Red Lines memory) ───────────────────────────────
; (redline <artist> ai-training never <set-on-date>)
; (redline <artist> term-max-years <years:Number> <set-on-date>)

; ── benchmark profiles (illustrative, synthetic) ───────────────────────────
; (benchmark <profile> <contract-kind> royalty-floor <percent>)
; (profile <profile> per-stream-usd <Number>)
; (profile <profile> xcoll-costs-usd <Number>)

; ── works, ownership and consent (licensing) ───────────────────────────────
; (work <wid> <title:String>)
; (owner <wid> master|composition <person> <share-percent:Number>)
; (licensor <wid> <person>)                         ; the passport holder
; (consent <wid> <person> <use-family> <territory> <date>)  ; verified consent event
; (terms <wid> ai-training <value> <clause-ref:String>)
; (terms <wid> voice-likeness <value> <clause-ref:String>)
; (terms <wid> max-licence-months <Number> <clause-ref:String>)
; (request <rid> <wid> <use> <territory> <months:Number> <party:String>)
;     use: ad|sync-ad|sync-film|live|sample|ai-training
; (region-in <smaller> <bigger>)                    ; KE ⊂ EA ⊂ AF ⊂ WW, US ⊂ NA ⊂ WW
; (use-family <use> sync|live|sample|ai-training)

; ── negotiation state (one round) ──────────────────────────────────────────
; (policy-step <policy> <topic> <index:Number> <value>)   ; label concession ladder
; (policy-floor <policy> <topic> <index:Number>)
; (policy-line <policy> <topic> <String>)                 ; human-readable source line
; (neg-open <topic> <ask> <label-position:Number>)        ; topic still open this round

; ── rights-health events (verified, from the artist's event log) ───────────
; (event <eid> <artist> <type> <subject> <date>)
;     type: work-registered | contributors-listed | ai-tools-disclosed |
;           ai-stance-set | splits-agreed | contract-clean | licence-cleared |
;           unresolved-red-signed | licence-missing-consent

; ============================================================================
; Result shapes (data, printed by queries as (result <tag> ...))
; ----------------------------------------------------------------------------
; (flag <cid> <n> <rule-id> red|amber)
; (redline-hit <cid> <n> <rule-id> <redline-kind> <set-on-date>)
; (verdict <rid> cleared|not-cleared|needs-consent <rule-id>)
; (trail <rid> <rule-id> <clause-refs> <facts>)
; (missing <rid> <person> <right> <share>)
; (condition <rid> <condition-key> <detail>)
; (move <topic> accept|counter|reject <value> <policy-line>)
; (advice <topic> concede|hold-redline|hold-flagged|concede-floor|walk-away|standoff <value>)
; (points <eid> <Number> <reason-key>)
; (badge <badge-id> <eid>)
; ============================================================================
