; The FULL Omega agent loop, natively on PeTTa (Windows, no Docker), with Kabla's plugins.
;
; Why this file exists: Omega's own run.metta clones Omega with git-import! and loads it through
; (library Omega ...) paths, which did not resolve on Windows. This is the same import list as Omega's
; lib_omega.metta, written with direct paths to the staged copy in ./repos/Omega, and then it calls (omega)
; exactly like run.metta does. Nothing in Omega's loop, memory or skills is changed.
; scripts/omega_run.py stages the copy, writes config.yaml and plugins.yaml, and runs this file with a watchdog.
!(import! &self (library lib_import))
!(import! &self (library lib_patrick))
!(import! &self (library lib_llm))
!(import! &self (library lib_vector))
!(import! &self (library lib_combinatorics))
!(import! &self (library lib_he))
!(import! &self ./repos/Omega/lib_nal)
!(import! &self ./repos/Omega/lib_pln)
!(import! &self ./repos/Omega/src/utils.py)
!(import! &self ./repos/Omega/src/utils)
!(import! &self ./repos/Omega/src/helper.py)
!(import! &self ./repos/Omega/src/config.py)
!(import! &self ./repos/Omega/src/config)
!(import! &self ./repos/Omega/providers/lib_llm_ext.py)
!(import! &self ./repos/Omega/src/logger.py)
!(import! &self ./repos/Omega/src/log)
!(import! &self ./repos/Omega/src/plugin.py)
!(import! &self ./repos/Omega/src/plugin)
!(import! &self ./repos/Omega/src/channels.py)
!(import! &self ./repos/Omega/src/channels)
!(import! &self ./repos/Omega/src/providers.py)
!(import! &self ./repos/Omega/src/providers)
!(import! &self ./repos/Omega/profile/policy.py)
!(import! &self ./repos/Omega/profile/policy)
!(import! &self ./repos/Omega/src/fileio.py)
!(import! &self ./repos/Omega/src/skills)
!(import! &self ./repos/Omega/src/websearch.py)
!(import! &self ./repos/Omega/src/memory)
!(import! &self ./repos/Omega/src/loop)
!(import! &self ./repos/Omega/src/rag.py)
!(git-import! "https://github.com/patham9/petta_lib_chromadb.git")
!(import! &self (library petta_lib_chromadb lib_chromadb))
; plugin.listPlugins reads config/plugins.yaml; the Kabla plugin is a .metta plugin, so make its folder importable.
!(py-call (plugin.addLocationToPath "{PLUGIN_DIR}"))

!(omega)
