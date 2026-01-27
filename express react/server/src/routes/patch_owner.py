# -*- coding: utf-8 -*-
from pathlib import Path
path = Path("auth.js")
lines = path.read_text(encoding="utf-8").splitlines()
# find addStaffToCentralDirectory block near owner register
start=None; end=None
for i,l in enumerate(lines):
    if 'addStaffToCentralDirectory({' in l:
        start=i-1
    if start is not None and 'management_db_name' in l and end is None:
        end=i+1
        break
if start is None or end is None:
    raise SystemExit('block not found')
new_lines = [
"      // 8. ?? ÚJ: Staff hozzáadása a központi nyilvántartáshoz",
"      await addStaffToCentralDirectory({",
"        id: insertResult.insertId,",
"        email: email,",
"        first_name: first_name,",
"        last_name: last_name,",
"        salon_db_name: dbs.salonDb,",
"        management_db_name: dbs.managementDb,",
"        role: 'owner'",
"      });",
]
lines = lines[:start] + new_lines + lines[end+1:]
path.write_text("\n".join(lines)+"\n", encoding="utf-8")
print('patched owner central add')
