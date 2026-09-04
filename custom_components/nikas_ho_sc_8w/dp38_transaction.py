"""Transactional DP38 planning for HO-SC-8W research builds.

No controller writes happen in this module.  A transaction is built from one
fresh controller READ block, a conservative patch, and an exact byte diff.  It
can later be used by a separately guarded writer after user confirmation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .dp38_patch import build_dp38_patch, expected_readback
from .models import decode_dp38, validate_dp38_block, validate_dp38_write_block


_FIELD_BY_OFFSET = {
    0: "zone_selector",
    1: "duration_minutes",
    14: "cycle_mode",
    15: "cycle_value",
    16: "anchor_year",
    17: "anchor_month",
    18: "anchor_day",
    19: "flags",
}


def _field_for_offset(offset: int) -> str:
    if 2 <= offset <= 7:
        return f"start_time_{offset - 1}_hour"
    if 8 <= offset <= 13:
        return f"start_time_{offset - 7}_minute"
    return _FIELD_BY_OFFSET[offset]


@dataclass(frozen=True)
class DP38ByteChange:
    offset: int
    field: str
    before: int
    after: int

    def as_dict(self) -> dict[str, Any]:
        return {
            "offset": self.offset,
            "field": self.field,
            "before": f"{self.before:02X}",
            "after": f"{self.after:02X}",
        }


@dataclass(frozen=True)
class DP38TransactionPlan:
    zone: int
    source_read: bytes
    write_block: bytes
    expected_read: bytes
    changes: tuple[DP38ByteChange, ...]

    @property
    def changed(self) -> bool:
        # byte 0 always changes representation READ zone -> WRITE one-hot.
        return any(change.offset != 0 for change in self.changes)

    @property
    def source_hex(self) -> str:
        return self.source_read.hex().upper()

    @property
    def write_hex(self) -> str:
        return self.write_block.hex().upper()

    @property
    def expected_read_hex(self) -> str:
        return self.expected_read.hex().upper()

    def as_dict(self) -> dict[str, Any]:
        before = decode_dp38(self.source_read)[0].as_dict()
        after = decode_dp38(self.expected_read)[0].as_dict()
        return {
            "dry_run": True,
            "zone": self.zone,
            "changed": self.changed,
            "source_read_hex": self.source_hex,
            "write_hex": self.write_hex,
            "expected_readback_hex": self.expected_read_hex,
            "byte_changes": [change.as_dict() for change in self.changes],
            "before": before,
            "after": after,
        }


def build_dp38_transaction(read_block: bytes, **patch: Any) -> DP38TransactionPlan:
    """Create a dry-run transaction from one fresh controller READ block."""
    validate_dp38_block(read_block)
    zone = read_block[0]
    write_block = build_dp38_patch(read_block, **patch)
    validate_dp38_write_block(write_block, expected_zone=zone)
    expected = expected_readback(write_block)

    changes: list[DP38ByteChange] = []
    # Compare WRITE representation for byte 0, and controller READ semantics for
    # bytes 1..19.  This makes the selector conversion visible without treating
    # it as a user-level schedule modification.
    write_view = bytes([write_block[0]]) + expected[1:]
    source_view = bytes([read_block[0]]) + read_block[1:]
    for offset, (before, after) in enumerate(zip(source_view, write_view, strict=True)):
        if before == after:
            continue
        changes.append(
            DP38ByteChange(
                offset=offset,
                field=_field_for_offset(offset),
                before=before,
                after=after,
            )
        )

    return DP38TransactionPlan(
        zone=zone,
        source_read=bytes(read_block),
        write_block=write_block,
        expected_read=expected,
        changes=tuple(changes),
    )


def verify_dp38_transaction_readback(
    plan: DP38TransactionPlan,
    actual_read: bytes,
) -> dict[str, Any]:
    """Verify an exact post-write READ block against a prepared transaction."""
    validate_dp38_block(actual_read, expected_zone=plan.zone)
    mismatches = []
    for offset, (expected, actual) in enumerate(
        zip(plan.expected_read, actual_read, strict=True)
    ):
        if expected == actual:
            continue
        mismatches.append(
            {
                "offset": offset,
                "field": _field_for_offset(offset),
                "expected": f"{expected:02X}",
                "actual": f"{actual:02X}",
            }
        )
    return {
        "verified": not mismatches,
        "zone": plan.zone,
        "expected_readback_hex": plan.expected_read_hex,
        "actual_readback_hex": actual_read.hex().upper(),
        "mismatches": mismatches,
    }
