from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PANEL = (ROOT / "custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js").read_text(encoding="utf-8")


def test_refresh_action_is_black_at_rest():
    assert ".refreshButton{color:var(--text)!important}" in PANEL
