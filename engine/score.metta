; ============================================================================
; Rights-health score (0–100). Not a credit score. Never compares artists.
; ----------------------------------------------------------------------------
; Every point is a verified event: (event <eid> <artist> <type> <subject> <date>)
; Weights are constants. Changing them is a documentation change (docs/PASSPORT.md).
; ============================================================================

(score-weight work-registered 15)
(score-weight contributors-listed 10)
(score-weight ai-tools-disclosed 10)
(score-weight ai-stance-set 10)
(score-weight splits-agreed 20)
(score-weight contract-clean 15)
(score-weight licence-cleared 15)
(score-weight unresolved-red-signed -5)
(score-weight licence-missing-consent -10)

(= (weight-of $type) (match &self (score-weight $type $w) $w))

(= (event-points $a)
   (match &self (event $eid $a $type $subject $date)
      (match &self (score-weight $type $w)
         (points $eid $w $type $subject))))

(= (raw-score $a)
   (let $ws (collapse (match &self (event $eid $a $type $subject $date)
                         (match &self (score-weight $type $w) $w)))
      (if (== $ws ()) 0 (foldl-atom $ws 0 $acc $x (+ $acc $x)))))

(= (score-of $a) (max 0 (raw-score $a)))
