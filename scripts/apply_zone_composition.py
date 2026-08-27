from __future__ import annotations

import json
from pathlib import Path

PANEL_VERSION = "0.6.14"
INTEGRATION_VERSION = "1.0.0-b005.32"


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing expected marker: {old[:100]}")
    return text.replace(old, new, 1)


panel_path = Path("custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js")
text = panel_path.read_text(encoding="utf-8")

for old, new in (
    ('const UI_VERSION = "0.6.13";', f'const UI_VERSION = "{PANEL_VERSION}";'),
    ('const ASSET_VERSION = "0.6.13";', f'const ASSET_VERSION = "{PANEL_VERSION}";'),
    ('zone2: assetUrl("zone-2.webp"),', 'zone2: assetUrl("zone-1.webp"),'),
    ('zone3: assetUrl("zone-3.webp"),', 'zone3: assetUrl("zone-1.webp"),'),
    ('zone4: assetUrl("zone-4.webp"),', 'zone4: assetUrl("zone-3.webp"),'),
    ('zone6: assetUrl("zone-6.webp"),', 'zone6: assetUrl("zone-4.webp"),'),
    (
        'return ({ 1: "mdi:sprinkler", 2: "mdi:sprinkler-variant", 3: "mdi:flower", 4: "mdi:greenhouse", 5: "mdi:sprout", 6: "mdi:pine-tree" })[zone] || "mdi:water";',
        'return ({ 1: "mdi:sprinkler", 2: "mdi:sprinkler", 3: "mdi:sprinkler", 4: "mdi:flower", 5: "mdi:shrub", 6: "mdi:greenhouse" })[zone] || "mdi:water";',
    ),
    (
        '<path class="wire rainWire" d="M 248 57 H 284 V 82 H 338"/>',
        '<path class="wire rainWire" d="M 248 57 L 338 82"/>',
    ),
    (
        '<span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>\n            <span class="zoneText"><b>Зона ${zone}</b><small>${this.esc(z.label)}</small></span>\n            <span class="duration">${this.esc(z.duration)}<small>мин</small></span>\n            <ha-icon class="readyIcon" icon="${readyIcon}"></ha-icon>',
        '<span class="scene scene${zone}"><ha-icon icon="${this.zoneIcon(zone)}"></ha-icon></span>',
    ),
):
    text = replace_once(text, old, new)

css_marker = (
    '        @media(max-width:520px){.headerTitle strong{font-size:21px}.headerTitle small{font-size:13px}'
    '.connectionBadge{font-size:16px}.connectionWrap>small{font-size:13px!important}}\n      `;'
)
css_patch = '''        @media(max-width:520px){.headerTitle strong{font-size:21px}.headerTitle small{font-size:13px}.connectionBadge{font-size:16px}.connectionWrap>small{font-size:13px!important}}
        /* v0.6.14: approved zone thumbnails and simplified rain-sensor wiring. */
        .schemaGrid .diagramZone{grid-template-rows:minmax(0,1fr);gap:0;padding:4px;overflow:hidden}
        .schemaGrid .diagramZone .scene{width:100%;height:100%;min-height:58px;border-radius:10px;background-position:center;background-size:cover;background-repeat:no-repeat}
        .schemaGrid .diagramZone .zoneText,.schemaGrid .diagramZone .duration,.schemaGrid .diagramZone .readyIcon{display:none!important}
        .schemaGrid .diagramZone.running{border-color:color-mix(in srgb,var(--a) 72%,#dce1e5);box-shadow:0 0 0 2px color-mix(in srgb,var(--a) 18%,transparent)}
        .schemaGrid .diagramZone.queued{border-color:color-mix(in srgb,var(--orange) 68%,#dce1e5);box-shadow:0 0 0 2px color-mix(in srgb,var(--orange) 16%,transparent)}
        @media(max-width:520px){.schemaGrid .diagramZone{grid-template-rows:minmax(0,1fr);min-height:76px;padding:3px}.schemaGrid .diagramZone .scene{height:100%;min-height:68px;border-radius:8px}}
      `;'''
text = replace_once(text, css_marker, css_patch)
panel_path.write_text(text, encoding="utf-8")

check_path = Path("scripts/check-panel-ui-v16.mjs")
check_text = check_path.read_text(encoding="utf-8")
check_text = replace_once(
    check_text,
    'const UI_VERSION = "0.6.13"',
    f'const UI_VERSION = "{PANEL_VERSION}"',
)
check_path.write_text(check_text, encoding="utf-8")

const_path = Path("custom_components/nikas_ho_sc_8w/const.py")
const_text = const_path.read_text(encoding="utf-8")
const_text = replace_once(
    const_text,
    'PANEL_VERSION = "0.6.13"',
    f'PANEL_VERSION = "{PANEL_VERSION}"',
)
const_path.write_text(const_text, encoding="utf-8")

manifest_path = Path("custom_components/nikas_ho_sc_8w/manifest.json")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["version"] = INTEGRATION_VERSION
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel_json_path = Path("panel.json")
panel_json = json.loads(panel_json_path.read_text(encoding="utf-8"))
panel_json["panel"]["dashboard_version"] = PANEL_VERSION
visual = panel_json["panel"]["system_visualization"]
visual["rain_sensor_connection"] = "single_direct_line_to_controller"
visual["zone_thumbnail_content"] = "zone_number_and_image_only"
visual["zone_thumbnail_visuals"] = {
    "1": "lawn",
    "2": "lawn",
    "3": "lawn",
    "4": "flowerbed",
    "5": "shrubs",
    "6": "greenhouse",
}
panel_json_path.write_text(json.dumps(panel_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

panel_manifest_path = Path("panel_manifest.json")
panel_manifest = json.loads(panel_manifest_path.read_text(encoding="utf-8"))
panel_manifest["panel_version"] = PANEL_VERSION
panel_manifest["integration_version"] = INTEGRATION_VERSION
panel_manifest["zone_thumbnail_content"] = "zone_number_and_image_only"
panel_manifest["zone_thumbnail_visuals"] = visual["zone_thumbnail_visuals"]
panel_manifest_path.write_text(
    json.dumps(panel_manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
