; ============================================================================
; Before-stage profile gaps
; ----------------------------------------------------------------------------
; Facts (written per request by api/kabla/services/onboarding.py):
;   (profile-work <artist> "<title>" <stated|unstated>)   splits stated or not
;   (profile-handle <artist> <platform>)
;   (profile-redline <artist> <kind>)
; Result: (profile-gap <artist> <gap-id> <detail>)
; This file ADDS rules only. It does not touch the flag, red-line, licence or
; score modules, and it never changes a weight or a readiness decision.
; "no-*" gaps use (collapse (match ...)) = () to mean "no such fact".
; ============================================================================

; A listed work whose splits the artist has not stated.
(= (profile-gaps $a)
   (match &self (profile-work $a $title unstated)
     (profile-gap $a splits-unstated $title)))

; No work listed at all.
(= (profile-gaps $a)
   (if (== (collapse (match &self (profile-work $a $t $s) $t)) ())
       (profile-gap $a no-works-listed none)
       (empty)))

; No platform handle recorded.
(= (profile-gaps $a)
   (if (== (collapse (match &self (profile-handle $a $p) $p)) ())
       (profile-gap $a no-handles none)
       (empty)))

; No standing AI-training red line yet.
(= (profile-gaps $a)
   (if (== (collapse (match &self (profile-redline $a ai-training) yes)) ())
       (profile-gap $a ai-stance-unset none)
       (empty)))
