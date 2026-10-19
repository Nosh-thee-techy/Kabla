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
