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
