; Rule id -> message key. Messages live in api/kabla/i18n/{en,sw}.json and are
; rendered from deterministic templates (no LLM). docs/RULES.md is generated
; from this file plus those templates (scripts/gen_rules_md.py).

(message-key R-GRANT-01 rule.R-GRANT-01)
(message-key R-GRANT-02 rule.R-GRANT-02)
(message-key R-TERM-01 rule.R-TERM-01)
(message-key R-AI-01 rule.R-AI-01)
(message-key R-AI-02 rule.R-AI-02)
(message-key R-VOICE-01 rule.R-VOICE-01)
(message-key R-REVERT-01 rule.R-REVERT-01)
(message-key R-XCOLL-01 rule.R-XCOLL-01)
(message-key R-OPT-01 rule.R-OPT-01)
(message-key R-ROY-01 rule.R-ROY-01)
(message-key R-AUDIT-01 rule.R-AUDIT-01)
(message-key R-SYNC-01 rule.R-SYNC-01)
(message-key R-SPLIT-01 rule.R-SPLIT-01)

(message-key R-LIC-AI licence.R-LIC-AI)
(message-key R-LIC-AI-OPTIN licence.R-LIC-AI-OPTIN)
(message-key R-LIC-TERM licence.R-LIC-TERM)
(message-key R-LIC-CONSENT licence.R-LIC-CONSENT)
(message-key R-LIC-OK licence.R-LIC-OK)

(message-key ai-training redline.ai-training)
(message-key term-max-years redline.term-max-years)

(= (msg-key $id) (match &self (message-key $id $key) $key))
