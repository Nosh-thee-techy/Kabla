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
