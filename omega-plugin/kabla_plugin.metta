; Kabla Omega plugin. Entry point: loadOmegaPlugin (see Omega docs/reference-plugin-api.md).
;
; Why it exists: Omega can call Kabla's four skills, and every skill is a thin HTTP call to the same
; FastAPI the web app uses. MeTTa on PeTTa (inside the API) still decides flags, verdicts and scores;
; this file only ferries facts and trails. It is mounted at <Omega>/plugins/kabla and listed in
; <Omega>/config/plugins.yaml (see omega-plugin/README.md and scripts/omega_demo.py).
; No import of kabla_skills.py here (its name differs from the .metta on purpose: same basename made the loader look for a Python module): Omega's loader puts this folder on sys.path, so py-call finds it by name.

(= (loadOmegaPlugin)
   (progn
      (add-skill kabla-analyze
         "Analyse a SYNTHETIC Kabla sample contract (c001, c002 or c003). Returns flags and a MeTTa trail. Does not give legal advice."
         (sample_id))
      (add-skill kabla-licence
         "Ask whether a use of the SYNTHETIC work Asali ya Jioni is cleared. use is ad|sync-film|ai-training etc."
         (use territory months party))
      (add-skill kabla-redline-set
         "Set an artist's standing red line (ai-training never, or term-max-years N). Remembered across contracts."
         (artist kind value))
      (add-skill kabla-explain
         "Answer why a clause was flagged, grounded in the stored MeTTa trail for a contract id."
         (contract_id question))
      (log INFO "kabla-plugin" "kabla-plugin loaded: 4 skills registered (calls FastAPI; MeTTa decides)")))

(= (kabla-analyze $sample_id)
   (py-call (kabla_skills.analyze $sample_id)))

(= (kabla-licence $use $territory $months $party)
   (py-call (kabla_skills.licence $use $territory $months $party)))

(= (kabla-redline-set $artist $kind $value)
   (py-call (kabla_skills.redline_set $artist $kind $value)))

(= (kabla-explain $contract_id $question)
   (py-call (kabla_skills.explain $contract_id $question)))
