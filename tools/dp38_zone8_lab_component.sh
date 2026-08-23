#!/bin/sh
# Install or roll back the branch-only HO-SC-8W DP38 Zone 8 laboratory component.
# This script changes only /config/custom_components/nikas_ho_sc_8w.

set -eu

ACTION="${1:-}"
CONFIG_DIR="${CONFIG_DIR:-/config}"
COMPONENTS_DIR="$CONFIG_DIR/custom_components"
TARGET="$COMPONENTS_DIR/nikas_ho_sc_8w"
BACKUP_ROOT="$CONFIG_DIR/.ha-ho-sc-8w-dp38-lab-backup"
BACKUP="$BACKUP_ROOT/nikas_ho_sc_8w"
STAGE_ROOT="$CONFIG_DIR/.ha-ho-sc-8w-dp38-lab-stage"
STAGE="$STAGE_ROOT/nikas_ho_sc_8w"
LAB_COMPONENT_COMMIT="47f087b43f5db3c9e175d23a009b369efa0de9c2"
ARCHIVE_URL="https://github.com/NikaSir/ha-ho-sc-8w/archive/${LAB_COMPONENT_COMMIT}.tar.gz"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_current_component() {
  [ -d "$TARGET" ] || fail "Current component not found: $TARGET"
  [ -f "$TARGET/manifest.json" ] || fail "manifest.json not found in current component"
  grep -q '"domain"[[:space:]]*:[[:space:]]*"nikas_ho_sc_8w"' "$TARGET/manifest.json" \
    || fail "Target folder is not the nikas_ho_sc_8w integration"
}

download_archive() {
  output="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fL --retry 3 --connect-timeout 15 "$ARCHIVE_URL" -o "$output"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$output" "$ARCHIVE_URL"
  else
    fail "Neither curl nor wget is available"
  fi
}

install_lab() {
  require_current_component
  [ ! -e "$BACKUP_ROOT" ] || fail "Backup already exists: $BACKUP_ROOT. Roll back first."
  [ ! -e "$STAGE_ROOT" ] || rm -rf "$STAGE_ROOT"

  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp" "$STAGE_ROOT"' EXIT INT TERM

  archive="$tmp/lab.tar.gz"
  echo "Downloading pinned lab component commit $LAB_COMPONENT_COMMIT..."
  download_archive "$archive"
  tar -xzf "$archive" -C "$tmp"

  source_component="$(find "$tmp" -type d -path '*/custom_components/nikas_ho_sc_8w' -print -quit)"
  [ -n "$source_component" ] || fail "Lab component was not found in downloaded archive"
  [ -f "$source_component/protocol_lab.py" ] || fail "protocol_lab.py missing from lab component"
  [ -f "$source_component/services.yaml" ] || fail "services.yaml missing from lab component"
  grep -q 'protocol_lab_zone8_rain_preflight' "$source_component/services.yaml" \
    || fail "Preflight action missing from lab component"
  grep -q 'protocol_lab_zone8_rain_probe' "$source_component/services.yaml" \
    || fail "Probe action missing from lab component"

  mkdir -p "$STAGE_ROOT"
  cp -a "$source_component" "$STAGE"

  mkdir -p "$BACKUP_ROOT"
  echo "Moving current component to backup..."
  if ! mv "$TARGET" "$BACKUP"; then
    rm -rf "$BACKUP_ROOT"
    fail "Could not create component backup"
  fi

  echo "Activating pinned lab component..."
  if ! mv "$STAGE" "$TARGET"; then
    echo "Lab activation failed; restoring original component..." >&2
    mv "$BACKUP" "$TARGET" || true
    rm -rf "$BACKUP_ROOT"
    fail "Could not activate lab component"
  fi

  rm -rf "$STAGE_ROOT"
  trap - EXIT INT TERM
  rm -rf "$tmp"

  echo "LAB COMPONENT INSTALLED"
  echo "Commit: $LAB_COMPONENT_COMMIT"
  echo "Backup: $BACKUP"
  echo "Restart Home Assistant manually, then run the read-only preflight action first."
  echo "Do NOT run the write probe before the preflight response is reviewed."
}

rollback_lab() {
  [ -d "$BACKUP" ] || fail "Backup not found: $BACKUP"
  [ -d "$TARGET" ] || fail "Current lab component not found: $TARGET"
  [ ! -e "$STAGE_ROOT" ] || rm -rf "$STAGE_ROOT"
  mkdir -p "$STAGE_ROOT"

  echo "Moving lab component aside..."
  mv "$TARGET" "$STAGE"

  echo "Restoring original component..."
  if ! mv "$BACKUP" "$TARGET"; then
    echo "Restore failed; returning lab component to its original path..." >&2
    mv "$STAGE" "$TARGET" || true
    fail "Could not restore original component"
  fi

  rm -rf "$STAGE_ROOT" "$BACKUP_ROOT"
  echo "ORIGINAL COMPONENT RESTORED"
  echo "Restart Home Assistant manually."
}

case "$ACTION" in
  install)
    install_lab
    ;;
  rollback)
    rollback_lab
    ;;
  *)
    echo "Usage: $0 install|rollback" >&2
    exit 2
    ;;
esac
