; ============================================================================
; Licence Desk: "can X use this work for Y in Z for N months?"
; ----------------------------------------------------------------------------
; Input:  (request <rid> <wid> <use> <territory> <months> <party>)
; Output: (decision <rid> cleared|not-cleared|needs-consent <rule-id> <refs> <facts>)
;         (missing <rid> <person> <right> <share>)       for needs-consent
;         (condition <rid> <key> <detail> <ref>)          for cleared
; <refs> are clause references ("c001-§7"), <facts> the atoms the rule used.
; ============================================================================

; ── vocabulary ──
(region-in KE EA)
(region-in TZ EA)
(region-in UG EA)
(region-in EA AF)
(region-in NG AF)
(region-in AF WW)
(region-in US NA)
(region-in NA WW)
(region-in GB EU)
(region-in EU WW)

(use-family ad sync)
(use-family sync-ad sync)
(use-family sync-film sync)
(use-family live live)
(use-family sample sample)
(use-family ai-training ai-training)

(= (family-of $use) (match &self (use-family $use $fam) $fam))

(= (in-region $a $a) True)
(= (in-region $small $big) (match &self (region-in $small $mid) (in-region $mid $big)))
(= (covers? $big $small) (present? (collapse (in-region $small $big))))

; ── helpers over agreed terms and the licensor's red lines ──
(= (term-value $w $key) (match &self (terms $w $key $value $ref) $value))
(= (term-ref $w $key) (match &self (terms $w $key $value $ref) $ref))
(= (term-fact $w $key) (match &self (terms $w $key $value $ref) (terms $w $key $value $ref)))

(= (ai-never-redline $w)
   (match &self (licensor $w $who)
     (match &self (redline $who ai-training never $date) (redline $who ai-training never $date))))

(= (ai-never? $w) (present? (collapse (ai-never-redline $w))))

; ── AI training ──
; Not cleared when the agreed terms only allow opt-in (or prohibit it) and the
; licensor's standing stance is "never".
(= (licence-decision $r)
   (match &self (request $r $w ai-training $terr $months $party)
      (let $value (term-value $w ai-training)
         (if (and (ai-never? $w) (or (== $value opt-in-paid) (== $value prohibited)))
             (decision $r not-cleared R-LIC-AI
                (collapse (term-ref $w ai-training))
                (collapse (superpose ((term-fact $w ai-training) (ai-never-redline $w)))))
             (if (== $value prohibited)
                 (decision $r not-cleared R-LIC-AI (collapse (term-ref $w ai-training))
                    (collapse (term-fact $w ai-training)))
                 (decision $r needs-consent R-LIC-AI-OPTIN (collapse (term-ref $w ai-training))
                    (collapse (term-fact $w ai-training))))))))

; ── every other use ──
(= (licence-decision $r)
   (match &self (request $r $w $use $terr $months $party)
      (if (== $use ai-training)
          (empty)
          (let $max (term-value $w max-licence-months)
             (if (> $months $max)
                 (decision $r not-cleared R-LIC-TERM
                    (collapse (term-ref $w max-licence-months))
                    (collapse (term-fact $w max-licence-months)))
                 (non-ai-consent-decision $r $w))))))

; replaced by the consent-aware version in the next step
(= (non-ai-consent-decision $r $w)
   (decision $r cleared R-LIC-OK () ()))

; ── conditions attached to a cleared licence ──
(= (licence-conditions $r)
   (match &self (request $r $w $use $terr $months $party)
      (let $max (term-value $w max-licence-months)
         (condition $r term-window ($months $max) (term-ref $w max-licence-months)))))

(= (licence-conditions $r)
   (match &self (request $r $w $use $terr $months $party)
      (condition $r territory-limit $terr none)))

(= (licence-conditions $r)
   (match &self (request $r $w $use $terr $months $party)
      (let $value (term-value $w ai-training)
         (if (== $value granted)
             (empty)
             (condition $r no-ai-training $value (term-ref $w ai-training))))))

(= (licence-conditions $r)
   (match &self (request $r $w $use $terr $months $party)
      (let $value (term-value $w voice-likeness)
         (if (== $value promo-only)
             (condition $r no-synthetic-voice $value (term-ref $w voice-likeness))
             (empty)))))
