from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PANEL = (ROOT / "custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js").read_text(encoding="utf-8")


def test_refresh_action_is_black_at_rest():
    assert ".refreshButton:not(.refresh-success):not(.refresh-error){color:var(--text)!important}" in PANEL
    assert ".refreshButton{color:var(--text)!important}" not in PANEL

def test_hero_accent_uses_canonical_density():
    canonical = ".systemOverview::before{top:-92px;right:-70px;width:205px;height:205px;border-radius:50%;background:color-mix(in srgb,var(--primary-color,#03a9d9) 12%,var(--card-background-color,#fff))"
    assert canonical in PANEL
    assert "background:rgba(3,169,217,0.07)" not in PANEL

