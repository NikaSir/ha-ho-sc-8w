import "./irrigation-panel-v0667.mjs";

const UI_VERSION = "0.6.68";
const LAST_FRESH_KEY = "nikas-ho-sc-8w.dp38.last-complete-snapshot";
const Panel = customElements.get("nikas-ho-sc-8w-panel");
if (!Panel) throw new Error("HO-SC-8W v0667 panel is not registered");
const p = Panel.prototype;
const previousProgramView = p.programView;
const previousRefreshProgramDp38 = p.refreshProgramDp38;
const previousRender = p._render;
const previousStyles = p.styles;

function readLastFresh() {
  try {
    const value = Number(localStorage.getItem(LAST_FRESH_KEY) || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (_) {
    return 0;
  }
}

function rememberLastFresh(value) {
  try { localStorage.setItem(LAST_FRESH_KEY, String(value)); } catch (_) {}
}

function formatSnapshotTime(value) {
  if (!value) return "время полного снимка неизвестно";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "время полного снимка неизвестно";
  const pad = (part) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

p.refreshProgramDp38 = async function refreshProgramDp38V0668() {
  await previousRefreshProgramDp38.call(this);
  if (this._programDp38RefreshStatus === "fresh") {
    const now = Date.now();
    this._programDp38LastFreshAt = now;
    rememberLastFresh(now);
  } else if (!this._programDp38LastFreshAt) {
    this._programDp38LastFreshAt = readLastFresh();
  }
  this.render();
};

p.programView = function programViewV0668(entities) {
  const content = previousProgramView.call(this, entities);
  return content.replace(/<section class="programFreshness[\s\S]*?<\/section>/, "");
};

p._decorateProgramFreshnessV0668 = function decorateProgramFreshnessV0668() {
  const root = this.shadowRoot;
  if (!root) return;
  root.querySelectorAll(".programFreshness").forEach((node) => node.remove());

  const headings = [...root.querySelectorAll("h1,h2,h3,h4")];
  const heading = headings.find((node) => /^Зона\s+[1-8]$/.test((node.textContent || "").trim()));
  if (!heading) return;

  const status = String(this._programDp38RefreshStatus || "idle");
  const fresh = status === "fresh";
  const lastFresh = fresh
    ? (this._programDp38LastFreshAt || Date.now())
    : (this._programDp38LastFreshAt || readLastFresh());

  let line = root.querySelector(".dp38InlineFreshness");
  if (!line) {
    line = document.createElement("span");
    line.className = "dp38InlineFreshness";
  }
  line.classList.toggle("fresh", fresh);
  line.classList.toggle("stale", !fresh);
  line.innerHTML = fresh
    ? `<i></i><b>Данные свежие</b><em>Данные получены: ${formatSnapshotTime(lastFresh)}</em>`
    : `<i></i><b>Данные устарели</b><em>Последний полный снимок: ${formatSnapshotTime(lastFresh)}</em>`;

  const titleArea = heading.parentElement;
  const ready = titleArea ? [...titleArea.querySelectorAll("span,b,div")].find((node) => /^(Готова|Готов|Данные устарели)$/.test((node.textContent || "").trim())) : null;
  if (ready?.parentElement) ready.parentElement.insertAdjacentElement("afterend", line);
  else heading.insertAdjacentElement("afterend", line);

  const section = heading.closest("section") || heading.parentElement?.parentElement;
  if (!section) return;
  section.classList.toggle("dp38SnapshotFresh", fresh);
  section.classList.toggle("dp38SnapshotStale", !fresh);

  const labels = ["Базовая длительность", "Сезонная коррекция", "Повтор", "Дата начала цикла", "Датчик дождя", "Ближайший запуск"];
  for (const node of section.querySelectorAll("small,span,b,div")) {
    const text = (node.textContent || "").trim();
    if (!labels.includes(text)) continue;
    let card = node.parentElement;
    while (card && card !== section && (card.textContent || "").length < 240) {
      if (card.children.length >= 2) break;
      card = card.parentElement;
    }
    if (!card || card === section) continue;
    card.classList.toggle("dp38DataFresh", fresh);
    card.classList.toggle("dp38DataStale", !fresh);
  }
};

p._render = function renderV0668() {
  previousRender.call(this);
  if (!this._programDp38LastFreshAt) this._programDp38LastFreshAt = readLastFresh();
  this._decorateProgramFreshnessV0668();
  const versionNode = this.shadowRoot?.querySelector("[data-ui-version]");
  if (versionNode) versionNode.textContent = `UI v${UI_VERSION}`;
};

p.styles = function stylesV0668() {
  return `${previousStyles.call(this)}
    .programFreshness{display:none!important}
    .dp38InlineFreshness{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:5px;font-size:11px;line-height:1.25;color:var(--muted)}
    .dp38InlineFreshness i{width:9px;height:9px;border-radius:50%;flex:0 0 9px;background:currentColor}
    .dp38InlineFreshness b{font-size:11px}.dp38InlineFreshness em{font-size:10.5px;font-style:normal;color:var(--muted)}
    .dp38InlineFreshness.fresh{color:var(--green)}
    .dp38InlineFreshness.stale{color:var(--warning-color,#d98200)}
    .dp38DataFresh{background:color-mix(in srgb,var(--green) 6%,var(--card))!important;border-color:color-mix(in srgb,var(--green) 22%,var(--line))!important}
    .dp38DataStale{background:color-mix(in srgb,var(--warning-color,#d98200) 7%,var(--card))!important;border-color:color-mix(in srgb,var(--warning-color,#d98200) 28%,var(--line))!important}
  `;
};