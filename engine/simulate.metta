; ============================================================================
; Earnings simulator (ILLUSTRATIVE — synthetic rates, not market data)
; ----------------------------------------------------------------------------
; (simulate <cid> <streams>) ->
;   (sim <cid> <streams> <gross> <royalty-earned> <advance> <recoup-debt> <artist-keeps>)
; gross          = streams x per-stream rate of the active profile
; royalty-earned = gross x royalty%
; recoup-debt    = advance (+ the profile's cross-collateral costs if the
;                  contract cross-collateralises), only if royalties are recoupable
; artist-keeps   = advance + max(0, royalty-earned - recoup-debt)
; The same function runs on the contract as written and on the counter /
; agreed version (bridge writes it as contract "<cid>-counter").
; ============================================================================

(= (or-default $list $default) (if (== $list ()) $default (car-atom $list)))

(= (sim-royalty $c) (or-default (collapse (match &self (clause $c $n royalty $p $r) $p)) 0))
(= (sim-recoup $c) (or-default (collapse (match &self (clause $c $n royalty $p $r) $r)) non-recoupable))
(= (sim-advance $c) (or-default (collapse (match &self (clause $c $n advance $a) $a)) 0))
(= (sim-rate) (match &self (active-profile $p) (match &self (profile $p per-stream-usd $rate) $rate)))
(= (sim-xcoll-costs $c)
   (if (present? (collapse (match &self (clause $c $n cross-collateral yes) $n)))
       (match &self (active-profile $p) (match &self (profile $p xcoll-costs-usd $x) $x))
       0))

(= (artist-keeps $earned $advance $debt $recoup)
   (if (== $recoup recoupable)
       (+ $advance (max 0 (- $earned $debt)))
       (+ $advance $earned)))

(= (simulate $c $streams)
   (let* (($gross (* $streams (sim-rate)))
          ($pct (sim-royalty $c))
          ($earned (/ (* $gross $pct) 100))
          ($advance (sim-advance $c))
          ($recoup (sim-recoup $c))
          ($debt (if (== $recoup recoupable) (+ $advance (sim-xcoll-costs $c)) 0)))
      (sim $c $streams $gross $earned $advance $debt (artist-keeps $earned $advance $debt $recoup))))
