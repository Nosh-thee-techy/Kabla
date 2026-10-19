!(check clauses-red-severity (base-severity R-GRANT-01) red)
!(check clauses-amber-severity (base-severity R-ROY-01) amber)
!(check clauses-topic (rule-topic R-AI-02) ai-training)
!(check clauses-priority-ai-first (priority-of ai-training) 1)
!(check clauses-every-rule-has-topic (size-atom (collapse (match &self (rule-info $r $s $t) $r))) 13)
!(check i18n-key-for-rule (msg-key R-AI-01) rule.R-AI-01)
!(check i18n-every-flag-rule-has-key
   (size-atom (collapse (match &self (rule-info $r $s $t) (msg-key $r))))
   13)
