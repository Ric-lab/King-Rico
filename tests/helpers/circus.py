"""Approved table shared by UI assertions; economy gates live in the audit tests."""
import json, subprocess
PAYS=json.loads(subprocess.check_output(['node','-p','JSON.stringify(require("./cloud/circus-profile.cjs").PAYS_V6)'],text=True))
def br_money(value):
    return f'{value:,.2f}'.replace(',','_').replace('.',',').replace('_','.')

WEIGHTS=[9,0,12,0,0,0,7,5,6,0,70,0,0,0,0,0]
def draws_for_grid(grid):
    result=[.99] # Skip the v6 villain draw.
    for symbol in grid:
        if symbol==5:result.append(.1)
        elif symbol==11:result.append(0)
        else:result.extend([.99,(sum(WEIGHTS[:symbol])+WEIGHTS[symbol]/2)/sum(WEIGHTS)])
    return result
