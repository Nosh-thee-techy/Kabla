!(import! &self ../../data/policies/mawingu.metta)

(neg-policy mawingu)

; ── AI: artist asks "never" (off the ladder). Label counters one step to opt-in-paid.
(neg-open ai-training never 0)
(neg-redline ai-training True)
!(check nego-ai-counter
   (round-of mawingu ai-training never 0 True)
   (round ai-training counter opt-in-paid
      "Mawingu policy 2.1 - AI training: ask granted, floor opt-in per use, paid"
      (advice ai-training hold-redline never)))

; At the floor, still not "never": label rejects → walk-away advice
!(check nego-ai-walk-away
   (round-of mawingu ai-training never 1 True)
   (round ai-training reject opt-in-paid
      "Mawingu policy 2.1 - AI training: ask granted, floor opt-in per use, paid"
      (advice ai-training walk-away never)))

; Artist asks the floor value: from step 0 the label counters to it (one step)
!(check nego-voice-toward-ask
   (round-of mawingu voice-likeness promo-only 0 False)
   (round voice-likeness counter promo-only
      "Mawingu policy 2.2 - voice: ask synthetic voice, floor name and photos for promotion only"
      (advice voice-likeness concede promo-only)))

; Already at the ask: accept
!(check nego-voice-accept
   (round-of mawingu voice-likeness promo-only 1 False)
   (round voice-likeness accept promo-only
      "Mawingu policy 2.2 - voice: ask synthetic voice, floor name and photos for promotion only"
      (advice voice-likeness concede promo-only)))

; Term: two steps (perpetual → 10 → 7). First round counters 10, not yet the ask.
!(check nego-term-step
   (round-of mawingu term 7 0 True)
   (round term counter 10
      "Mawingu policy 1.2 - term: ask perpetual, floor 7 years"
      (advice term hold-redline 7)))

; Royalty at floor, ask already met
!(check nego-royalty-accept
   (round-of mawingu royalty 18 2 False)
   (round royalty accept 18
      "Mawingu policy 3.1 - royalty: ask 12%, floor 18%"
      (advice royalty concede 18)))

; Cross-collateral at floor, artist still wants "no" which IS the floor value — accept
; Reject path for a non-redline: option-periods ask off-ladder
!(check nego-options-reject-standoff
   (round-of mawingu option-periods mutual 1 False)
   (round option-periods reject label-only-2
      "Mawingu policy 1.4 - options: ask three label options, floor two label options"
      (advice option-periods standoff label-only-2)))
