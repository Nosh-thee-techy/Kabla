; SYNTHETIC — negotiation policy of the invented publisher "Pwani Publishing".

(policy-name pwani "Pwani Publishing")

(policy-step pwani term 0 10)
(policy-step pwani term 1 7)
(policy-floor pwani term 1)
(policy-line pwani term "Pwani policy A - term: ask 10 years, floor 7 years")

(policy-step pwani ai-training 0 vague)
(policy-step pwani ai-training 1 opt-in-paid)
(policy-floor pwani ai-training 1)
(policy-line pwani ai-training "Pwani policy B - new uses: ask open wording, floor opt-in per use, paid")

(policy-step pwani cross-collateral 0 yes)
(policy-floor pwani cross-collateral 0)
(policy-line pwani cross-collateral "Pwani policy C - cross-collateral is not negotiable")

(policy-step pwani audit 0 none)
(policy-step pwani audit 1 yes)
(policy-floor pwani audit 1)
(policy-line pwani audit "Pwani policy D - audit: ask none, floor one audit a year")
