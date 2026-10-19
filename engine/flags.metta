; ============================================================================
; Red-flag rules: clause facts -> (flag <cid> <n> <rule-id> <severity> <fact>)
; ----------------------------------------------------------------------------
; One `=` clause of flags-of per rule; (collapse (flags-of $c)) gathers them.
; The last element is the clause fact the rule matched: the trail's evidence.
; Severity here is the rule's base severity; effective-flags (redlines.metta)
; raises it when a red line is violated.
; ============================================================================

; R-GRANT-01: perpetual + worldwide + exclusive grant
(= (flags-of $c)
   (match &self (clause $c $n grant $right perpetual worldwide exclusive)
      (flag $c $n R-GRANT-01 red (clause $c $n grant $right perpetual worldwide exclusive))))

; R-GRANT-02: perpetual but non-exclusive grant
(= (flags-of $c)
   (match &self (clause $c $n grant $right perpetual $terr non-exclusive)
      (flag $c $n R-GRANT-02 amber (clause $c $n grant $right perpetual $terr non-exclusive))))

; R-AI-01: AI training granted without opt-in
(= (flags-of $c)
   (match &self (clause $c $n ai-training granted no-opt-in)
      (flag $c $n R-AI-01 red (clause $c $n ai-training granted no-opt-in))))

; R-AI-02: AI / machine-learning use in vague wording
(= (flags-of $c)
   (match &self (clause $c $n ai-training vague)
      (flag $c $n R-AI-02 amber (clause $c $n ai-training vague))))

; R-VOICE-01: synthetic voice / likeness rights granted
; (promo-only use of name and approved photos is standard and not flagged)
(= (flags-of $c)
   (match &self (clause $c $n voice-likeness granted synthetic-voice)
      (flag $c $n R-VOICE-01 red (clause $c $n voice-likeness granted synthetic-voice))))

; R-REVERT-01: rights never revert
(= (flags-of $c)
   (match &self (clause $c $n reversion none)
      (flag $c $n R-REVERT-01 amber (clause $c $n reversion none))))

; R-XCOLL-01: cross-collateralisation across agreements
(= (flags-of $c)
   (match &self (clause $c $n cross-collateral yes)
      (flag $c $n R-XCOLL-01 amber (clause $c $n cross-collateral yes))))

; R-ROY-01: royalty below the active (illustrative) benchmark for this kind of deal
(= (royalty-floor $c)
   (match &self (contract-kind $c $kind)
     (match &self (active-profile $profile)
       (match &self (benchmark $profile $kind royalty-floor $floor) $floor))))

(= (flags-of $c)
   (match &self (clause $c $n royalty $pct $recoup)
      (let $floor (royalty-floor $c)
         (if (< $pct $floor)
             (flag $c $n R-ROY-01 amber (clause $c $n royalty $pct $recoup))
             (empty)))))

; R-OPT-01: option periods only the label can exercise
(= (flags-of $c)
   (match &self (clause $c $n option-periods $k label-only)
      (flag $c $n R-OPT-01 amber (clause $c $n option-periods $k label-only))))

; R-AUDIT-01: no audit right (explicitly excluded, or no audit clause at all)
(= (flags-of $c)
   (match &self (clause $c $n audit none)
      (flag $c $n R-AUDIT-01 amber (clause $c $n audit none))))

(= (flags-of $c)
   (match &self (contract $c)
      (if (present? (collapse (match &self (clause $c $n audit $v) $n)))
          (empty)
          (flag $c 0 R-AUDIT-01 amber (missing $c audit)))))

; R-SYNC-01: label may license sync without the artist's approval
(= (flags-of $c)
   (match &self (clause $c $n sync-approval label-only)
      (flag $c $n R-SYNC-01 amber (clause $c $n sync-approval label-only))))

; R-SPLIT-01: co-writer splits not stated, or not summing to 100
(= (flags-of $c)
   (match &self (clause $c $n splits not-stated)
      (flag $c $n R-SPLIT-01 amber (clause $c $n splits not-stated))))

(= (flags-of $c)
   (match &self (clause $c $n splits stated $total)
      (if (== $total 100)
          (empty)
          (flag $c $n R-SPLIT-01 amber (clause $c $n splits stated $total)))))
