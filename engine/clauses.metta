; ============================================================================
; Clause vocabulary, rule catalogue and severities
; ----------------------------------------------------------------------------
; (rule-info <rule-id> <base-severity> <topic>)
;   base-severity is what the rule reports on its own; a violated red line
;   raises it to red (see redlines.metta).
;   topic links a flag to a negotiation topic (negotiate.metta).
; (topic-priority <topic> <n>)  artist agent order: AI/voice, grant, term,
;   reversion, royalty, then the rest (BUILD_SPEC §6.4).
; ============================================================================

(clause-type grant)
(clause-type term)
(clause-type ai-training)
(clause-type voice-likeness)
(clause-type royalty)
(clause-type advance)
(clause-type reversion)
(clause-type cross-collateral)
(clause-type option-periods)
(clause-type audit)
(clause-type sync-approval)
(clause-type splits)

(rule-info R-GRANT-01 red grant)
(rule-info R-GRANT-02 amber grant)
(rule-info R-TERM-01 red term)
(rule-info R-AI-01 red ai-training)
(rule-info R-AI-02 amber ai-training)
(rule-info R-VOICE-01 red voice-likeness)
(rule-info R-REVERT-01 amber reversion)
(rule-info R-XCOLL-01 amber cross-collateral)
(rule-info R-OPT-01 amber option-periods)
(rule-info R-ROY-01 amber royalty)
(rule-info R-AUDIT-01 amber audit)
(rule-info R-SYNC-01 amber sync-approval)
(rule-info R-SPLIT-01 amber splits)

(topic-priority ai-training 1)
(topic-priority voice-likeness 2)
(topic-priority grant 3)
(topic-priority term 4)
(topic-priority reversion 5)
(topic-priority royalty 6)
(topic-priority cross-collateral 7)
(topic-priority option-periods 8)
(topic-priority audit 9)
(topic-priority sync-approval 10)
(topic-priority splits 11)

(= (base-severity $rule) (match &self (rule-info $rule $sev $topic) $sev))
(= (rule-topic $rule) (match &self (rule-info $rule $sev $topic) $topic))
(= (priority-of $topic) (match &self (topic-priority $topic $p) $p))

; The artist on whose behalf a contract is read (whose red lines apply).
(= (artist-of $c) (match &self (contract-artist $c $a) $a))

; 1 if any atom matches, used for presence tests without leaking bindings.
(= (present? $list) (if (== $list ()) False True))
