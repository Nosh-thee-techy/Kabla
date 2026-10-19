(active-profile p-sim)
(profile p-sim per-stream-usd 0.003)
(profile p-sim xcoll-costs-usd 1500)

; as written: 12% recoupable, USD 2000 advance, cross-collateralised
(clause s-written 6 advance 2000)
(clause s-written 11 royalty 12 recoupable)
(clause s-written 15 cross-collateral yes)
; counter: 18%, same advance, no cross-collateral
(clause s-counter 6 advance 2000)
(clause s-counter 11 royalty 18 recoupable)
(clause s-counter 15 cross-collateral no)
; distribution deal: 70%, nothing recoupable
(clause s-dist 5 royalty 70 non-recoupable)

; 5M streams -> gross 15000; 12% = 1800 < 2000+1500 debt -> keeps only the advance
!(check sim-written-unrecouped (simulate s-written 5000000)
   (sim s-written 5000000 15000.0 1800.0 2000 3500 2000))
; 18% = 2700 > 2000 debt -> keeps 2000 + 700
!(check sim-counter-recouped (simulate s-counter 5000000)
   (sim s-counter 5000000 15000.0 2700.0 2000 2000 2700.0))
; non-recoupable: keeps every royalty
!(check sim-distribution (simulate s-dist 1000000)
   (sim s-dist 1000000 3000.0 2100.0 0 0 2100.0))
!(check sim-zero-streams (simulate s-written 0)
   (sim s-written 0 0.0 0.0 2000 3500 2000))
