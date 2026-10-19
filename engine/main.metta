; Kabla engine entrypoint.
; The bridge runs:  main.metta  <request>/facts.metta  <request>/query.metta
; PeTTa loads the files in order into one &self, so the rule modules imported
; here see the per-request facts, and the query file prints (result ...) lines.

!(import! &self ./schema.metta)
!(import! &self ./clauses.metta)
!(import! &self ./flags.metta)
!(import! &self ./redlines.metta)
!(import! &self ./licence.metta)
!(import! &self ./simulate.metta)
!(import! &self ./i18n_keys.metta)
