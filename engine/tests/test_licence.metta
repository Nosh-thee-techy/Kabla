; Work and agreed terms (as written by the bridge after a passport is issued)
(work tw "Test Song")
(licensor tw tz)
(redline tz ai-training never 2026-10-19)
(owner tw master tz 100)
(owner tw composition tz 60)
(owner tw composition tb 40)
(terms tw ai-training opt-in-paid "c001-§7")
(terms tw voice-likeness promo-only "c001-§9")
(terms tw max-licence-months 12 "work-policy")

; a second work whose licensor has no AI red line
(work tw2 "Other Song")
(licensor tw2 tq)
(owner tw2 master tq 100)
(terms tw2 ai-training opt-in-paid "c009-§3")
(terms tw2 max-licence-months 12 "work-policy")

; ── vocabulary ──
!(check region-ke-in-world (covers? WW KE) true)
!(check region-ke-in-ea (covers? EA KE) true)
!(check region-us-not-in-ke (covers? KE US) false)
!(check family-ad-is-sync (family-of ad) sync)

; ── AI training ──
(request r-ai tw ai-training WW 12 "Some AI lab")
(request r-ai2 tw2 ai-training WW 12 "Some AI lab")

!(check ai-not-cleared-never
   (licence-decision r-ai)
   (decision r-ai not-cleared R-LIC-AI ("c001-§7")
      ((terms tw ai-training opt-in-paid "c001-§7") (redline tz ai-training never 2026-10-19))))
!(check ai-opt-in-needs-consent-without-redline
   (licence-decision r-ai2)
   (decision r-ai2 needs-consent R-LIC-AI-OPTIN ("c009-§3") ((terms tw2 ai-training opt-in-paid "c009-§3"))))

; ── licence window ──
(request r-long tw ad KE 24 "Long Brand")
!(check term-too-long
   (licence-decision r-long)
   (decision r-long not-cleared R-LIC-TERM ("work-policy") ((terms tw max-licence-months 12 "work-policy"))))

; ── conditions ──
(request r-ad tw ad KE 6 "Nuru Soaps")
!(check-has condition-window (collapse (licence-conditions r-ad))
   (condition r-ad term-window (6 12) "work-policy"))
!(check-has condition-no-ai (collapse (licence-conditions r-ad))
   (condition r-ad no-ai-training opt-in-paid "c001-§7"))
!(check-has condition-voice (collapse (licence-conditions r-ad))
   (condition r-ad no-synthetic-voice promo-only "c001-§9"))
