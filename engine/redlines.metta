; ============================================================================
; Artist red lines (standing rules) and how they fire
; ----------------------------------------------------------------------------
; Facts:  (redline <artist> ai-training never <date>)
;         (redline <artist> term-max-years <years> <date>)
; Result: (redline-hit <cid> <n> <rule-id> <kind> <value> <date>)
;   -> trail line "You told Kabla on <date>: ... Clause <n> violates this."
; A flag whose clause and rule are hit is raised to red (effective-flags).
; Imported after flags.metta: it adds the R-TERM-01 clause of flags-of.
; ============================================================================

; ── AI training: "never" is violated by any grant or vague wording ──
(= (redline-hits-of $c)
   (match &self (contract-artist $c $a)
     (match &self (redline $a ai-training never $date)
       (match &self (clause $c $n ai-training granted no-opt-in)
          (redline-hit $c $n R-AI-01 ai-training never $date)))))

(= (redline-hits-of $c)
   (match &self (contract-artist $c $a)
     (match &self (redline $a ai-training never $date)
       (match &self (clause $c $n ai-training vague)
          (redline-hit $c $n R-AI-02 ai-training never $date)))))

; ── Term: longer than the artist's maximum, or perpetual ──
(= (term-exceeds? $years $max)
   (if (== $years perpetual) True (> $years $max)))

(= (redline-hits-of $c)
   (match &self (contract-artist $c $a)
     (match &self (redline $a term-max-years $max $date)
       (match &self (clause $c $n term $years)
          (if (term-exceeds? $years $max)
              (redline-hit $c $n R-TERM-01 term-max-years $max $date)
              (empty))))))

; R-TERM-01: term beyond the artist's red line (only exists with a red line)
(= (flags-of $c)
   (let (redline-hit $c2 $n R-TERM-01 $kind $max $date) (redline-hits-of $c)
      (match &self (clause $c $n term $years)
         (flag $c $n R-TERM-01 red (clause $c $n term $years)))))

; ── Severity raise ──
(= (hit-for? $c $n $rule)
   (present? (collapse
      (let (redline-hit $c2 $n2 $rule2 $kind $v $d) (redline-hits-of $c)
         (if (and (== $n $n2) (== $rule $rule2)) yes (empty))))))

(= (effective-flags $c)
   (let (flag $c2 $n $rule $sev $fact) (flags-of $c)
      (if (hit-for? $c $n $rule)
          (flag $c $n $rule red $fact)
          (flag $c $n $rule $sev $fact))))
