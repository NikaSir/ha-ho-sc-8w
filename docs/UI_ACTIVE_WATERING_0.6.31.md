# Active watering UI refinement — UI 0.6.31

Field-validated presentation target:

- Status header uses `Автополив · зона N` for automatic watering and `Ручной полив · зона N` for manual watering.
- Runtime is the second status line: `Осталось N мин`; do not wrap the zone number onto a standalone line.
- Active zone uses a light-blue card surface, blue outline and active water path; activity must not rely on text alone.
- Zones view removes the eyebrow `ЗОНЫ 1–6` and heading `Рабочие зоны`.
- Zones view keeps one enlarged explanatory line: `Фактическое состояние и программа каждого канала.`
- The six zone cards share all remaining work-area height at 100% scale; do not shrink typography merely to fit them.
- Active zone card shows `Полив · осталось N мин`; scheduled duration remains separate from live remaining time.
- At 100% on the approved phone layout, Header and Bottom Nav stay fixed and the six-card Zones view should fit without vertical scrolling.
- Normal zone cards remain neutral; only the active watering zone receives the active surface treatment.
