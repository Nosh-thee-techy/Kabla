; Hand-calculated: 15+10+10+10+20+15 = 80, then two -5 red flags → 70, floor at 0.

(event e1 za work-registered w-asali 2026-10-19)
(event e2 za contributors-listed w-asali 2026-10-19)
(event e3 za ai-tools-disclosed w-asali 2026-10-19)
(event e4 za ai-stance-set za 2026-10-19)
(event e5 za splits-agreed w-asali 2026-10-19)
(event e6 za contract-clean c003 2026-10-19)

!(check score-empty (score-of nobody) 0)
!(check score-clean (score-of za) 80)
!(check-has score-reason-work (collapse (event-points za))
   (points e1 15 work-registered w-asali))

(event e7 za unresolved-red-signed c001 2026-10-19)
(event e8 za unresolved-red-signed c001 2026-10-19)
!(check score-after-reds (score-of za) 70)

; Penalties cannot take a new artist below 0
(event e9 zb licence-missing-consent r-x 2026-10-19)
(event e10 zb licence-missing-consent r-y 2026-10-19)
!(check score-floor (score-of zb) 0)
