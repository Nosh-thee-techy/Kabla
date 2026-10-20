// Compile contracts/KablaPassport.sol with solc-js to prove it is syntactically and type valid.
// This is a compile check only: nothing is deployed and no chain is involved.
// Setup: cd .vendor/chain && npm install solc@0.8.26
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const require = createRequire(resolve(root, ".vendor/chain/package.json"));
const solc = require("solc");

const file = "KablaPassport.sol";
const src = readFileSync(resolve(root, "contracts", file), "utf8");
const out = JSON.parse(solc.compile(JSON.stringify({
  language: "Solidity",
  sources: { [file]: { content: src } },
  settings: { optimizer: { enabled: true, runs: 200 }, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } },
})));

const errors = (out.errors || []).filter((e) => e.severity === "error");
for (const e of out.errors || []) console.log(`${e.severity}: ${e.formattedMessage.split("\n")[0]}`);
if (errors.length) { console.log("COMPILE FAILED"); process.exit(1); }

const c = out.contracts[file].KablaPassport;
mkdirSync(resolve(root, "docs/evidence"), { recursive: true });
writeFileSync(resolve(root, "docs/evidence/KablaPassport.abi.json"), JSON.stringify(c.abi, null, 2));
console.log(`solc ${solc.version()}`);
console.log(`COMPILE OK: KablaPassport, ${c.evm.bytecode.object.length / 2} bytes of init code, ${c.abi.length} ABI entries`);
