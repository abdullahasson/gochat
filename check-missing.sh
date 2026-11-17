#!/bin/bash
# شغّله من /root :  bash check-missing.sh
# بيطبع أي ملف محلي server.js عامله require وهو مش موجود على السيرفر
cd /root
grep -o 'require("\./[^"]*")' server.js | sort -u | sed 's/require("\.\///; s/")//' | while read r; do
  if [ ! -f "$r" ] && [ ! -f "$r.js" ] && [ ! -f "$r/index.js" ]; then echo "MISSING: $r"; fi
done
echo "done"
