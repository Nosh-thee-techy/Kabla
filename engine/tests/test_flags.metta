; Each rule: one positive and one negative case, on its own contract id.

; ── R-GRANT-01 / R-GRANT-02 ──
(clause t-grant-pos 4 grant master perpetual worldwide exclusive)
(clause t-grant-neg 4 grant master term-limited worldwide exclusive)
(clause t-grant2-pos 4 grant master perpetual kenya non-exclusive)

!(check-has grant01-positive (collapse (flags-of t-grant-pos))
   (flag t-grant-pos 4 R-GRANT-01 red (clause t-grant-pos 4 grant master perpetual worldwide exclusive)))
!(check grant01-negative (collapse (flags-of t-grant-neg)) ())
!(check-has grant02-positive (collapse (flags-of t-grant2-pos))
   (flag t-grant2-pos 4 R-GRANT-02 amber (clause t-grant2-pos 4 grant master perpetual kenya non-exclusive)))
!(check grant02-not-on-exclusive (size-atom (collapse (flags-of t-grant-pos))) 1)

; ── R-AI-01 / R-AI-02 ──
(clause t-ai-pos 7 ai-training granted no-opt-in)
(clause t-ai-vague 8 ai-training vague)
(clause t-ai-optin 6 ai-training opt-in-paid)
(clause t-ai-none 6 ai-training prohibited)

!(check-has ai01-positive (collapse (flags-of t-ai-pos))
   (flag t-ai-pos 7 R-AI-01 red (clause t-ai-pos 7 ai-training granted no-opt-in)))
!(check-has ai02-positive (collapse (flags-of t-ai-vague))
   (flag t-ai-vague 8 R-AI-02 amber (clause t-ai-vague 8 ai-training vague)))
!(check ai-negative-opt-in (collapse (flags-of t-ai-optin)) ())
!(check ai-negative-prohibited (collapse (flags-of t-ai-none)) ())

; ── R-VOICE-01 / R-REVERT-01 / R-XCOLL-01 ──
(clause t-voice-pos 9 voice-likeness granted synthetic-voice)
(clause t-voice-neg 7 voice-likeness granted promo-only)
(clause t-rev-pos 13 reversion none)
(clause t-rev-neg 8 reversion 5)
(clause t-xc-pos 15 cross-collateral yes)
(clause t-xc-neg 15 cross-collateral no)

!(check-has voice01-positive (collapse (flags-of t-voice-pos))
   (flag t-voice-pos 9 R-VOICE-01 red (clause t-voice-pos 9 voice-likeness granted synthetic-voice)))
!(check voice01-negative-promo-only (collapse (flags-of t-voice-neg)) ())
!(check-has revert01-positive (collapse (flags-of t-rev-pos))
   (flag t-rev-pos 13 R-REVERT-01 amber (clause t-rev-pos 13 reversion none)))
!(check revert01-negative (collapse (flags-of t-rev-neg)) ())
!(check-has xcoll01-positive (collapse (flags-of t-xc-pos))
   (flag t-xc-pos 15 R-XCOLL-01 amber (clause t-xc-pos 15 cross-collateral yes)))
!(check xcoll01-negative (collapse (flags-of t-xc-neg)) ())
