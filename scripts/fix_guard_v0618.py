from pathlib import Path
p=Path('scripts/check-panel-ui-v16.mjs')
s=p.read_text()
s=s.replace("  'class=\"rainSensor ${rain.tone}\"',\n","")
p.write_text(s)
