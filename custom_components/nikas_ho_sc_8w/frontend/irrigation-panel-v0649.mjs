import "./irrigation-panel-v0648.mjs";

const UI_VERSION = "0.6.49";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousSampleSummary = p._zone8SampleSummary;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._zone8SampleSummary = function zone8SampleSummaryV0649(sample) {
  const summary = previousSampleSummary.call(this, sample);
  const station = Number(sample.station);
  if (!Number.isInteger(station) || station < 1 || station > 8) return summary;
  const comparison = sample.matches_known_backup === true
    ? "резерв: совпадает"
    : "резерв: отличается";
  return `${summary} · ${comparison}`;
};

p.diagnosticsView = function diagnosticsViewV0649(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const trace = attrs.hex_probe_trace || {};
  const zones = Array.isArray(trace.zones_seen) ? trace.zones_seen.join(", ") : "нет";
  let content = previousDiagnosticsView.call(this, entities)
    .replaceAll("Сначала прочитайте зону 8", "Запись аварийно остановлена")
    .replaceAll("Восстановить исходную зону 8", "Запись DP38 отключена")
    .replaceAll(
      "Единственная разрешённая запись: известный повреждённый блок заменяется точной резервной копией только зоны 8.",
      "После несовпадения ответа все записи DP38 остановлены. Доступен только полный снимок зон 1–8.",
    );
  content = content.replace(
    /<div class="zone8Trace">[\s\S]*?<\/div>/,
    `<div class="zone8Trace">Запросов: ${Number(trace.active_requests || 0)} · ответов: ${Number(trace.responses || 0)} · зоны: ${this.esc(zones)} · полный круг: ${trace.complete_round === true ? "да" : "нет"} · DP: ${this.esc((trace.dps_seen || []).join(", ") || "нет")}</div>`,
  );
  return content;
};

p._render = function renderV0649() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0649() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};
