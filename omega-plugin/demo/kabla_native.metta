; Native (no Docker) harness: Omega's OWN plugin loader and skill registry, on our PeTTa.
;
; Why it exists: the full Omega agent imports vector search and LLM libraries (torch, chromadb), several GB,
; which this machine cannot hold. The plugin loader (src/plugin.*), skill registry (src/skills.metta),
; config and logger do not need them. So this file imports only those Omega modules, skips the LLM loop
; and the memory store, and loads the Kabla plugin through Omega's real loadMettaPlugin path.
; MeTTa on PeTTa (inside the Kabla API) still makes every decision.
!(import! &self (library lib_import))
!(import! &self ./repos/Omega/src/utils.py)
!(import! &self ./repos/Omega/src/utils)
!(import! &self ./repos/Omega/src/helper.py)
!(import! &self ./repos/Omega/src/config.py)
!(import! &self ./repos/Omega/src/config)
!(import! &self ./repos/Omega/src/logger.py)
!(import! &self ./repos/Omega/src/log)
!(import! &self ./repos/Omega/src/plugin.py)
!(import! &self ./repos/Omega/src/plugin)
!(import! &self ./repos/Omega/src/skills)
!(initConfig)
!(initLogger)
; Omega's own loadMettaPlugin did not finish on Windows (see docs/DECISIONS.md), so its three steps are done by hand here:
; put the plugin folder on sys.path, import its .metta, call its loadOmegaPlugin. Skills land in Omega's real registry (add-skill).
!(py-call (plugin.addLocationToPath "{PLUGIN_DIR}"))
!(import! &self ./repos/Omega/plugins/kabla/kabla_plugin)
!(loadOmegaPlugin)

!(py-call (kabla_skills.say "KABLA-DEMO skills registered with Omega:"))
!(py-call (kabla_skills.say (getSkills)))

!(py-call (kabla_skills.say "KABLA-DEMO step 1: artist sets a red line through the Omega skill"))
!(py-call (kabla_skills.say (kabla-redline-set zawadi ai-training never)))

!(py-call (kabla_skills.say "KABLA-DEMO step 2: analyse contract c001 through the Omega skill"))
!(py-call (kabla_skills.say (py-call (kabla_skills.summarize (kabla-analyze c001)))))

!(py-call (kabla_skills.say "KABLA-DEMO step 3: a different contract, c002, same artist, no red line restated"))
!(py-call (kabla_skills.say (py-call (kabla_skills.summarize (kabla-analyze c002)))))

!(py-call (kabla_skills.say "KABLA-DEMO done"))
