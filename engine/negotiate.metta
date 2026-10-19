; ============================================================================
; Negotiation: label concession ladders, one step per round, artist decides
; ----------------------------------------------------------------------------
; Facts (written by the API for one round):
;   (neg-policy <policy>)
;   (neg-open <topic> <ask> <label-index>)
;   (neg-redline <topic> True|False)
; Policy file (data/policies/<name>.metta) is loaded as an extra PeTTa file.
;
; Result: (round <topic> accept|counter|reject <offered> <policy-line>
;                (advice <topic> concede|hold-redline|hold-flagged|walk-away|standoff <value>))
; The artist still approves or rejects in the UI. Advice is never auto-applied.
; ============================================================================

(= (value-at $p $topic $i)
   (match &self (policy-step $p $topic $i $v) $v))

(= (floor-of $p $topic)
   (match &self (policy-floor $p $topic $i) $i))

(= (line-of $p $topic)
   (match &self (policy-line $p $topic $text) $text))

(= (at-floor? $p $topic $i)
   (if (>= $i (floor-of $p $topic)) True False))

(= (next-step $p $topic $i)
   (match &self (policy-step $p $topic $j $v)
      (if (== $j (+ $i 1)) (step $j $v) (empty))))

; One concession toward the artist's ask, never past the policy floor.
(= (label-move $p $topic $i $ask)
   (let* (($v (value-at $p $topic $i))
          ($line (line-of $p $topic))
          ($next (collapse (next-step $p $topic $i))))
      (if (== $v $ask)
          (move $topic accept $v $line)
          (if (== $next ())
              (move $topic reject $v $line)
              (let (step $j $nv) (car-atom $next)
                 (if (> $j (floor-of $p $topic))
                     (move $topic reject $v $line)
                     (move $topic counter $nv $line)))))))

(= (advice-on $topic $kind $ask $offered $is-redline)
   (if (== $kind accept)
       (advice $topic concede $offered)
       (if (== $kind reject)
           (if (== $is-redline True)
               (advice $topic walk-away $ask)
               (advice $topic standoff $offered))
           (if (== $offered $ask)
               (advice $topic concede $offered)
               (if (== $is-redline True)
                   (advice $topic hold-redline $ask)
                   (advice $topic hold-flagged $ask))))))

(= (round-of $p $topic $ask $i $is-redline)
   (let (move $t $kind $offered $line) (label-move $p $topic $i $ask)
      (round $topic $kind $offered $line (advice-on $topic $kind $ask $offered $is-redline))))

(= (rounds)
   (match &self (neg-open $topic $ask $i)
      (match &self (neg-policy $p)
         (match &self (neg-redline $topic $rl)
            (round-of $p $topic $ask $i $rl)))))
