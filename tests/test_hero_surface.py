"""Regression guard for the approved flat five-percent HERO surface."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / "custom_components/nikas_ho_sc_8w/frontend/irrigation-panel.js"
SURFACE = "color-mix(in srgb,var(--card-background-color,#fff) 95%,var(--primary-color,#03a9d9) 5%)"


class HeroSurfaceTests(unittest.TestCase):
    def test_photo_card_surface_is_flat_and_theme_aware(self):
        source = PANEL.read_text(encoding="utf-8")
        rules = re.findall(r"\.systemOverview\{([^{}]*)\}", source)
        self.assertTrue(rules, "Missing system overview selector")
        backgrounds = [
            value.strip()
            for rule in rules
            for value in re.findall(r"(?:^|;)background\s*:\s*([^;]+)", rule)
        ]
        self.assertTrue(backgrounds, "HERO surface must be explicit, not inherited")
        for value in backgrounds:
            self.assertEqual(value, SURFACE, "HERO surface must be flat card 95% + primary 5%")
        for rule in rules:
            self.assertNotIn("gradient(", rule)


if __name__ == "__main__":
    unittest.main()
