"""Protocol-lab invariants for the HO-SC-8W DP38 Zone 8 probe."""

from __future__ import annotations

import importlib.util
import sys
import types
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKAGE_NAME = "custom_components.nikas_ho_sc_8w"
PACKAGE_PATH = ROOT / "custom_components" / "nikas_ho_sc_8w"

package = types.ModuleType(PACKAGE_NAME)
package.__path__ = [str(PACKAGE_PATH)]
sys.modules.setdefault(PACKAGE_NAME, package)


def _load_module(name: str):
    full_name = f"{PACKAGE_NAME}.{name}"
    spec = importlib.util.spec_from_file_location(full_name, PACKAGE_PATH / f"{name}.py")
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {full_name}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[full_name] = module
    spec.loader.exec_module(module)
    return module


_load_module("const")
models = _load_module("models")


class DP38Zone8ProbeTests(unittest.TestCase):
    @staticmethod
    def block(flags: int, zone: int = 8) -> bytes:
        return bytes(
            [
                zone,
                10,
                5,
                0xFF,
                0xFF,
                0xFF,
                0xFF,
                0xFF,
                0,
                0xFF,
                0xFF,
                0xFF,
                0xFF,
                0xFF,
                3,
                2,
                26,
                8,
                23,
                flags,
            ]
        )

    def test_enable_changes_only_flag_bit_zero(self) -> None:
        before = self.block(0x10)
        after = models.build_dp38_zone8_rain_probe(before, True)

        self.assertEqual(after[19], 0x11)
        self.assertEqual(before[:19], after[:19])
        self.assertEqual(
            models.dp38_byte_diff(before, after),
            [{"offset": 19, "before": 0x10, "after": 0x11, "xor": 0x01}],
        )

    def test_disable_preserves_all_other_flag_bits(self) -> None:
        before = self.block(0xB7)
        after = models.build_dp38_zone8_rain_probe(before, False)

        self.assertEqual(after[19], 0xB6)
        self.assertEqual(before[:19], after[:19])
        self.assertEqual(before[19] & 0xFE, after[19] & 0xFE)

    def test_noop_is_allowed_when_requested_state_already_matches(self) -> None:
        before = self.block(0x11)
        after = models.build_dp38_zone8_rain_probe(before, True)

        self.assertEqual(after, before)
        self.assertEqual(models.dp38_byte_diff(before, after), [])

    def test_production_zone_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "Expected DP38 zone 8"):
            models.build_dp38_zone8_rain_probe(self.block(0x10, zone=7), True)

    def test_invalid_length_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "exactly 20 bytes"):
            models.build_dp38_zone8_rain_probe(self.block(0x10)[:-1], True)


if __name__ == "__main__":
    unittest.main()
