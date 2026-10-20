; Demo harness: starts Omega's own loader, loads the Kabla plugin, and calls its skills.
;
; Why it exists: the full Omega agent loop needs an LLM and an embedding model. This harness runs the
; same start-up steps as Omega's (omega) function in src/loop.metta up to and including (initPlugins), which is the
; code that reads config/plugins.yaml and calls loadOmegaPlugin. It then invokes the skills the way the agent would,
; and skips the LLM loop. No model is involved; MeTTa on PeTTa (inside the Kabla API) makes every decision.
!(import! &self (library lib_import))
!(git-import! "https://github.com/singnet/Omega.git")
!(import! &self (library Omega lib_omega))

!(import! &self (library Omega ./plugins/kabla/kabla_plugin.py))

!(initConfig)
!(initLoop)
!(initLogger)
!(initPlugins)

!(py-call (kabla_plugin.say "KABLA-DEMO skills registered with Omega:"))
!(collapse (match &self (dynamic-skill $f ($f $d $a)) $f))

!(py-call (kabla_plugin.say "KABLA-DEMO step 1: artist sets a red line through the Omega skill"))
!(py-call (kabla_plugin.say (kabla-redline-set zawadi ai-training never)))

!(py-call (kabla_plugin.say "KABLA-DEMO step 2: analyse contract c001 through the Omega skill"))
!(py-call (kabla_plugin.say (py-call (kabla_plugin.summarize (kabla-analyze c001)))))

!(py-call (kabla_plugin.say "KABLA-DEMO step 3: a different contract, c002, same artist, no red line restated"))
!(py-call (kabla_plugin.say (py-call (kabla_plugin.summarize (kabla-analyze c002)))))

!(py-call (kabla_plugin.say "KABLA-DEMO done"))
