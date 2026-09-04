#!/usr/bin/env python3
from pathlib import Path

path = Path('custom_components/nikas_ho_sc_8w/api.py')
text = path.read_text(encoding='utf-8')

old = '''                write_block = bytes.fromhex(str(plan["write_hex"]))\n                validate_dp38_write_block(write_block, expected_zone=7)\n                self._write_dp38_hex_block(write_block)\n                time.sleep(1.0)\n'''
new = '''                write_block = bytes.fromhex(str(plan["write_hex"]))\n                validate_dp38_write_block(write_block, expected_zone=7)\n                if write_block[0] != 0x40:\n                    raise RuntimeError("Zone 7 write selector must be exactly 0x40")\n                required_safety = {\n                    DP_OPERATION_MODE,\n                    DP_ACTIVE_ZONE,\n                    DP_QUEUED_ZONE,\n                }\n                seen_safety = set(\n                    self.device.zone8_hex_probe_trace.get("safety_dps_seen", [])\n                )\n                if not required_safety.issubset(seen_safety):\n                    raise RuntimeError("Fresh DP101/107/108 safety state was not received")\n                if str(self.device.operation_mode).lower() != "auto":\n                    raise RuntimeError("Set the physical controller to ON/Auto before the Zone 7 lab write")\n                # Use only the already field-validated one-hot-mask transport.\n                # The legacy read-side DP38 writer remains blocked.\n                self._write_dp38_mask_block(write_block, zone=7)\n                time.sleep(1.0)\n'''
if old not in text:
    if new in text:
        print('already hardened')
        raise SystemExit(0)
    raise RuntimeError('Zone 7 writer marker not found')
text = text.replace(old, new, 1)
text = text.replace(
    'from .dp38_transaction import prepare_dp38_transaction, verify_dp38_readback\n',
    'from .dp38_transaction import prepare_dp38_transaction\n',
    1,
)
path.write_text(text, encoding='utf-8')
print('Zone 7 lab writer hardened')
