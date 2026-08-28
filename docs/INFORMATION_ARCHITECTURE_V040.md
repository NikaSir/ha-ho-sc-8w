# HO-SC-8W panel information architecture v0.4

> Historical UI v0.4 snapshot, retained for design lineage only. It is not the current navigation contract. Runtime v0.6.30 uses `Состояние · Зоны · Программа · Ручной · Диагн.` and the shell rules in `NIKAS_SPECIALIZED_PANEL_UI_STANDARD.md` v1.9 plus `NIKAS_PANEL_NAVIGATION_CONTRACT.md`.

This document defines the user-facing information architecture of the integration-owned HO-SC-8W panel.

It complemented the then-current `Home Assistant NikaS · Integration Dashboard UI Standard v1.2`.

## Primary navigation

```text
Обзор · Ручной · Настройки · Диагн.
```

The old primary `Зоны` and `Программы` tabs are removed from the Bottom Tab Bar.

## Overview

Overview answers two operational questions first:

1. what is happening now;
2. what will happen next according to the automatic program.

Below the status and controller-wide telemetry, zones 1–6 are listed compactly.

Tapping a zone opens its drill-down settings/status screen. Long press on the entity-backed zone row still opens Home Assistant more-info.

## Zone drill-down

A zone is a channel of the single HO-SC-8W controller, not a peer device and not a primary application tab.

The zone drill-down shows the factual values currently stored by the controller:

- enabled/disabled program state;
- base duration;
- one or more start times;
- calendar/cycle mode;
- cycle anchor/start date;
- follow/ignore rain behavior;
- current global seasonal adjustment.

The screen is read-only until a verified public write API is published.

## Manual watering

Manual watering is a primary workflow:

```text
select zone → set duration → start
```

UI v0.4 implements zone and duration selection as local UI state so the workflow can be reviewed on the target phone.

The Start button is intentionally disabled. The frontend does not send raw DP45 and does not synthesize a fake action. Actual start/stop becomes available only through a tested integration-owned public Action/API.

## Settings

Settings contains only controller-wide parameters:

- operation mode;
- seasonal adjustment;
- global rain-sensor permission;
- irrigation order/mode.

Per-zone scheduling does not belong here.

The current screen is read-only until a safe public write API is published.

## Diagnostics

Diagnostics contains:

- active connection;
- controller mode;
- irrigation order;
- active/queued zones;
- schedule cache status;
- rain sensor state;
- timer error state;
- UI metadata;
- unverified main-valve status boundary;
- diagnostics-only Zone 8.

### Program audit drill-down

`Проверка программы` is a read-only lower-level Diagnostics screen.

Its purpose is simple: quickly confirm that the controller actually contains the intended automatic program after configuration.

For zones 1–6 it presents the decoded DP38 values in human-readable form. It does not edit anything. Raw DP38 remains technical diagnostic data, not a normal configuration interface.

## Safety boundary

The v0.4 information architecture changes navigation and presentation only.

It does not add controller write capability. Production zones 1–6 remain protected from unverified write paths; Zone 8 remains diagnostics/development-only.
