; Kabla Omega plugin. Entry point: loadOmegaPlugin (see Omega docs/reference-plugin-api.md).
!(import! &self (library Omega ./kabla_plugin.py))

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
      (log INFO "kabla-plugin" "kabla-plugin skills registered (calls FastAPI; MeTTa decides)")))

(= (kabla-analyze $sample_id)
   (py-call (kabla_plugin.analyze $sample_id)))

(= (kabla-licence $use $territory $months $party)
   (py-call (kabla_plugin.licence $use $territory $months $party)))

(= (kabla-redline-set $artist $kind $value)
   (py-call (kabla_plugin.redline_set $artist $kind $value)))

(= (kabla-explain $contract_id $question)
   (py-call (kabla_plugin.explain $contract_id $question)))
