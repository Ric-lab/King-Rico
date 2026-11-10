"""Approved table shared by UI assertions; economy gates live in the audit tests."""
import json, subprocess
PAYS=json.loads(subprocess.check_output(['node','-p','JSON.stringify(require("./cloud/circus-profile.cjs").PAYS)'],text=True))
def br_money(value):
    return f'{value:,.2f}'.replace(',','_').replace('.',',').replace('_','.')
