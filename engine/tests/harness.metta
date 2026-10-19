; Minimal test harness. PeTTa's built-in `test` halts on the first failure;
; these helpers print one line per assertion so run_tests.py can count them.

(= (check $name $actual $expected)
   (if (== $actual $expected) (PASS $name) (FAIL $name $actual $expected)))

; $item must be a member of the collapsed list $list
(= (check-has $name $list $item)
   (if (is-member $item $list) (PASS $name) (FAIL $name $list (expected-member $item))))

; $item must NOT be a member of the collapsed list $list
(= (check-lacks $name $list $item)
   (if (is-member $item $list) (FAIL $name $list (unexpected-member $item)) (PASS $name)))
