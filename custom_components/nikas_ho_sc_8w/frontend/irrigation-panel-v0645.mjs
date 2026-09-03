import "./irrigation-panel-v0644.mjs";

const UI_VERSION = "0.6.45";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;
const previousStyles = p.styles;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0645(status) {
  return {
    idle: "Чтение ещё не запускалось",
    reading_before: "Собираю ответы DP38 зоны 8",
    verified: "Получен стабильный ответ зоны 8",
    observed_variants: "Контроллер вернул разные ответы",
    failed: "Зона 8 не ответила",
  }[status] || String(status || "Нет данных");
};

p._zone8SampleSummary = function zone8SampleSummaryV0645(sample) {
  const starts = Array.isArray(sample.start_times) && sample.start_times.length
    ? sample.start_times.join(" · ") : "нет запусков";
  const rain = sample.rain_sensor_follow_inferred ? "дождь: да" : "дождь: нет";
  return `${sample.duration_minutes ?? "—"} мин · ${starts} · цикл ${sample.cycle_mode_raw ?? "—"}/${sample.cycle_value ?? "—"} · ${sample.anchor_date || "дата не задана"} · ${rain}`;
};

p.diagnosticsView = function diagnosticsViewV0645(entities) {
  const content = previousDiagnosticsView.call(this, entities);
  const attrs = this.attrs(entities.zones[8].schedule);
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  if (!samples.length) return content;
  const cards = `<div class="zone8Samples">${samples.map((sample, index) => `
    <article>
      <b>Ответ ${index + 1}${Number(sample.count) > 1 ? ` × ${sample.count}` : ""}</b>
      <code>${this.esc(sample.raw_hex || "")}</code>
      <span>${this.esc(this._zone8SampleSummary(sample))}</span>
    </article>`).join("")}</div>`;
  return content.replace(
    '<button type="button" class="zone8ProbeButton"',
    `${cards}<button type="button" class="zone8ProbeButton"`,
  );
};

p._render = function renderV0645() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0645() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

p.styles = function stylesV0645() {
  return `${previousStyles.call(this)}
    .zone8Samples{display:grid;gap:7px}.zone8Samples article{display:grid;gap:4px;padding:9px;border:1px solid var(--line);border-radius:11px;background:var(--card)}.zone8Samples b{font-size:12px}.zone8Samples code{overflow-wrap:anywhere;font-size:11px;font-weight:700}.zone8Samples span{color:var(--muted);font-size:11px;line-height:1.35}
  `;
};
