; SYNTHETIC — illustrative benchmark profile. NOT market data.
; Used by R-ROY-01 and the earnings simulator; always labelled "illustrative".

(benchmark profile-illustrative-A recording royalty-floor 18)
(benchmark profile-illustrative-A publishing royalty-floor 50)
(benchmark profile-illustrative-A distribution royalty-floor 60)

; net receipts per stream reaching the label, and costs a cross-collateral
; clause would let the label pull in from other deals
(profile profile-illustrative-A per-stream-usd 0.003)
(profile profile-illustrative-A xcoll-costs-usd 1500)

(active-profile profile-illustrative-A)
