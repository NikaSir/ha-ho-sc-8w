import "./irrigation-panel-v0645.mjs";

const UI_VERSION = "0.6.46";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W base panel is not registered");
const p = Panel.prototype;
const previousDiagnosticsView = p.diagnosticsView;
const previousRender = p._render;

p._zone8HexProbeStatusText = function zone8HexProbeStatusTextV0646(status) {
  return {
    idle: "Чтение ещё не запускалось",
    reading_before: "Собираю все ответы DP38",
    verified: "Получен стабильный ответ зоны 8",
    observed_variants: "Зона 8 вернула разные ответы",
    observed_other_zones: "DP38 ответил другой зоной",
    cached_only: "Свежего ответа нет — показан кэш",
    no_dp38: "Контроллер не вернул DP38",
    failed: "Чтение не выполнено",
  }[status] || String(status || "Нет данных");
};

p._zone8SampleSummary = function zone8SampleSummaryV0646(sample) {
  if (sample.valid === false) return `Невалидный блок: ${sample.error || "неизвестный формат"}`;
  const starts = Array.isArray(sample.start_times) && sample.start_times.length
    ? sample.start_times.join(" · ") : "нет запусков";
  const rain = sample.rain_sensor_follow_inferred ? "дождь: да" : "дождь: нет";
  return `${sample.duration_minutes ?? "—"} мин · ${starts} · цикл ${sample.cycle_mode_raw ?? "—"}/${sample.cycle_value ?? "—"} · ${sample.anchor_date || "дата не задана"} · ${rain}`;
};

p.diagnosticsView = function diagnosticsViewV0646(entities) {
  const attrs = this.attrs(entities.zones[8].schedule);
  const trace = attrs.hex_probe_trace || {};
  const samples = Array.isArray(attrs.hex_probe_samples) ? attrs.hex_probe_samples : [];
  let content = previousDiagnosticsView.call(this, entities)
    .replace(
      "Два одинаковых свежих чтения текущего блока DP38 зоны 8. Команды записи не отправляются.",
      "Собираются все ответы DP38 без фильтра по зоне. Команды записи не отправляются.",
    );
  if (samples.length) {
    const cards = `<div class="zone8Samples">${samples.map((sample, index) => {
      const source = sample.fresh === false ? "ранее сохранён" : "свежий ответ";
      const station = Number(sample.station) || "?";
      return `<article>
        <b>Блок ${index + 1} · зона ${station} · ${source}${Number(sample.count) > 1 ? ` · повторов: ${sample.count}` : ""}</b>
        <code>${this.esc(sample.raw_hex || "")}</code>
        <span>${this.esc(this._zone8SampleSummary(sample))}</span>
      </article>`;
    }).join("")}</div>`;
    content = content.replace(
      /<div class="zone8Samples">[\s\S]*?<\/div><button type="button" class="zone8ProbeButton"/,
      `${cards}<button type="button" class="zone8ProbeButton"`,
    );
  }
  const traceText = Number.isFinite(Number(trace.active_requests))
    ? `<div class="zone8Trace">Запросов: ${Number(trace.active_requests)} · ответов: ${Number(trace.responses || 0)} · варианты DP38: ${Number(trace.dp38_variants || 0)} · DP: ${this.esc((trace.dps_seen || []).join(", ") || "нет")}</div>`
    : "";
  if (traceText) {
    content = content.replace(
      '<button type="button" class="zone8ProbeButton"',
      `${traceText}<button type="button" class="zone8ProbeButton"`,
    );
  }
  return content;
};

p._render = function renderV0646() {
  previousRender.call(this);
  const versionNode = this.shadowRoot?.querySelector(".headerTitle small");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.header = function headerV0646() {
  return `<header class="appHeader">
    <button class="headerButton menuButton" data-ha-menu aria-label="Меню Home Assistant"><ha-icon icon="mdi:menu"></ha-icon></button>
    <button class="headerTitle" type="button" data-parent-nav aria-label="Вернуться в базовую панель NikaS"><strong>Автополив</strong><small>UI v${UI_VERSION}</small></button>
    <button class="headerButton refreshButton" data-refresh aria-label="Обновить"><ha-icon icon="mdi:refresh"></ha-icon></button>
  </header>`;
};

const previousStyles = p.styles;
p.styles = function stylesV0646() {
  return `${previousStyles.call(this)}
    .zone8Trace{padding:8px 9px;border-radius:10px;background:var(--soft);color:var(--muted);font-size:11px;line-height:1.35}
  `;
};
