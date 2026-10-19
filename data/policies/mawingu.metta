; SYNTHETIC — negotiation policy of the invented label "Mawingu Records".
; A concession ladder per topic: step 0 is the contract as written, the label
; concedes at most one step per round and never beyond policy-floor.

(policy-name mawingu "Mawingu Records")

(policy-step mawingu ai-training 0 granted)
(policy-step mawingu ai-training 1 opt-in-paid)
(policy-floor mawingu ai-training 1)
(policy-line mawingu ai-training "Mawingu policy 2.1 - AI training: ask granted, floor opt-in per use, paid")

(policy-step mawingu voice-likeness 0 synthetic-voice)
(policy-step mawingu voice-likeness 1 promo-only)
(policy-floor mawingu voice-likeness 1)
(policy-line mawingu voice-likeness "Mawingu policy 2.2 - voice: ask synthetic voice, floor name and photos for promotion only")

(policy-step mawingu grant 0 perpetual-worldwide-exclusive)
(policy-step mawingu grant 1 term-worldwide-exclusive)
(policy-step mawingu grant 2 term-africa-exclusive)
(policy-floor mawingu grant 2)
(policy-line mawingu grant "Mawingu policy 1.1 - grant: ask perpetual worldwide, floor exclusive in Africa for the term")

(policy-step mawingu term 0 perpetual)
(policy-step mawingu term 1 10)
(policy-step mawingu term 2 7)
(policy-floor mawingu term 2)
(policy-line mawingu term "Mawingu policy 1.2 - term: ask perpetual, floor 7 years")

(policy-step mawingu reversion 0 none)
(policy-step mawingu reversion 1 7)
(policy-floor mawingu reversion 1)
(policy-line mawingu reversion "Mawingu policy 1.3 - reversion: ask none, floor after 7 years if unrecouped")

(policy-step mawingu royalty 0 12)
(policy-step mawingu royalty 1 15)
(policy-step mawingu royalty 2 18)
(policy-floor mawingu royalty 2)
(policy-line mawingu royalty "Mawingu policy 3.1 - royalty: ask 12%, floor 18%")

(policy-step mawingu cross-collateral 0 yes)
(policy-step mawingu cross-collateral 1 no)
(policy-floor mawingu cross-collateral 1)
(policy-line mawingu cross-collateral "Mawingu policy 3.2 - cross-collateral: ask yes, floor this agreement only")

(policy-step mawingu option-periods 0 label-only-3)
(policy-step mawingu option-periods 1 label-only-2)
(policy-floor mawingu option-periods 1)
(policy-line mawingu option-periods "Mawingu policy 1.4 - options: ask three label options, floor two label options")
