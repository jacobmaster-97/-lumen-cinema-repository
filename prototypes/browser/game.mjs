import {stepper,installMobileInput} from './mobile-input.mjs';
import * as E from "./engine.mjs";
import * as C from "./construction.mjs";
import {constructionSummary,constructionPanel,roomConstruction} from "./construction-ui.mjs";
import {operationsPanel,forecastPanel,draftForecast} from './operations-ui.mjs';
import {strategyView,reviewPanel,cashPanel,maintenanceForm} from './strategy-ui.mjs';
import { CinemaRenderer, drawPoster, setPosterAssets } from "./render.mjs?v=0.7.2";
import { loadCinemaAssets } from "./assets.mjs";
import { CinemaAudio } from "./audio.mjs";
import { hallUnderRepair } from "./world.mjs";
const audio=new CinemaAudio();
installMobileInput(document);
let strategySection="ratings",investmentSection="assets",mapBranch=null,savedCamera=null,deleteDraft=null;
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const money = (n) =>
  (n < 0 ? "−" : "") +
  "$" +
  Math.round(Math.abs(n || 0)).toLocaleString("en-HK");
const clock = (n) => {
  const t = E.OPEN_MINUTE + Math.max(0, Math.round(n));
  return (
    String(Math.floor(t / 60)).padStart(2, "0") +
    ":" +
    String(t % 60).padStart(2, "0")
  );
};
const STORAGE = "lumen-cinema-v2";
let selectedZone = null;
let selectedBlock=null;
let saveReady=false,lastLoadError='',pendingRecovery=null;
let state = E.createGame({construction:true}),
  view = "overview",
  filmFilter = "available",
  reportIndex = 0,
  renderer = null,
  atlas = null,
  images = {},
  mini = null,
  toastTimer = null,
  renderedPhase = "planning",
  saveTimer = 0;
const b = () =>
  state.branches.find((b) => b.id === state.activeBranch) || state.branches[0];
const planning = () => state.phase === "planning";
const disabled = () => (planning() ? "" : "disabled");
const labels = {
  overview: [
    "YOUR CINEMA, YOUR STORY",
    "大銀幕，小生意。",
    "由一間戲院開始，讓每一場好戲都有人欣賞。",
  ],
  schedule: [
    "THE DAILY PROGRAMME",
    "每一場，都有安排。",
    "按電影片長排場，留足清潔時間；錯開開場，服務更從容。",
  ],
  movies: [
    "NOW SHOWING & COMING SOON",
    "好戲，由你揀。",
    "每週有新片，熱度會回落；留意片商分帳，大片未必最賺錢。",
  ],
  staff: [
    "THE PEOPLE BEHIND THE SCREEN",
    "一間戲院，一隊人。",
    "親自分配崗位，排班自動處理。專長配對有更高效率。",
  ],
  snacks: [
    "A LITTLE EXTRA, A LOT OF JOY",
    "好戲，配好味。",
    "自動供貨，按銷量扣成本。定價與服務能力，一樣重要。",
  ],
  strategy: ["QUALITY & LONG-TERM HEALTH","好口碑，長做長有。","定價、服務、清潔與觀影品質，逐步塑造你的戲院。"],
  investment: [
    "BUILD YOUR CINEMA STORY",
    "把生意，變成自己的。",
    "裝修、提升設備、買斷物業，再為第二間戲院亮燈。",
  ],
  report: [
    "BEHIND EVERY FULL HOUSE",
    "散場之後，睇清盤數。",
    "分開票房、分帳與成本，了解每一間戲院的真正表現。",
  ],
};
function toast(text, error = false) {
  $("#toast").textContent = text;
  $("#toast").className = error ? "error" : "";
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5000);
}
function readStored() {
  try {
    return localStorage.getItem(STORAGE);
  } catch {
    return null;
  }
}
function persist(silent = true) {
  // The temporary boot state must never replace an existing, unread save.
  if(!saveReady){if(!silent)toast('請先讀取原有進度，或確認重新開局。原存檔未被覆蓋。',true);return false;}
  try {
    localStorage.setItem(STORAGE, E.saveGame(state));
    if (!silent) toast("進度已儲存在呢個瀏覽器。");
    return true;
  } catch {
    if (!silent) toast("瀏覽器未能儲存；請檢查儲存空間或私隱設定。", true);
    return false;
  }
}
function result(error, message) {
  if (error) {
    toast(error, true);
    return false;
  }
  if (message) toast(message);
  persist();
  render();
  return true;
}
function openModal(html, { event = false } = {}) {
  if (state.phase === "running" && !event) {
    state.paused = true;
    updateHeader();
  }
  $("#utilities").hidden=true;$("#more-button").setAttribute("aria-expanded","false");
  $("#modal-content").innerHTML = html;
  $("#modal").classList.toggle("programme-modal",html.includes('id="programme-form"'));
  if($("#programme-form"))$("#programme-form .modal-form").append($(".programme-details"));
  if (!$("#modal").open) $("#modal").showModal();
  hydratePosters($("#modal-content"));
}
function closeModal() {
  if ($("#modal").open) $("#modal").close();
}
const modalHeader = (eyebrow, title, canClose = true) =>
  `<div class="modal-header" ${canClose?'data-swipe-dismiss':''}><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>${canClose ? '<button class="modal-close" data-action="close" aria-label="關閉">×</button>' : ""}</div>`;
function hydratePosters(root = document) {
  for (const c of root.querySelectorAll("canvas[data-movie]")) {
    const m = E.movie(c.dataset.movie);
    if (m) drawPoster(c, m);
  }
}
function estimateNet(branch) {
  const l = { ...branch.ledger };
  if (state.phase !== "closed" && C.operational(branch)) {
    l.wages = branch.staff.reduce((n, p) => n + p.wage, 0);
    l.rent = branch.owned ? 0 : branch.rent;
    l.maintenance = (l.maintenance||0)+
      280 + branch.upgrades.sound * 70 + branch.upgrades.seats * 45;
  }
  return E.net(l);
}
function updateHeader() {
  const v = b();
  $("#day-number").textContent = "第 " + state.day + " 日";
  $("#calendar").textContent =
    `第 ${Math.ceil(state.day / 7)} 週・星期${["一", "二", "三", "四", "五", "六", "日"][(state.day - 1) % 7]}`;
  $("#phase-label").textContent = {
    planning: "營業前準備",
    running: state.paused
      ? "營業已暫停"
      : "兩店同步營業".replace(
          "兩店",
          state.branches.filter(C.operational).length < 2 ? "戲院" : "兩店",
        ),
    event: "突發事件・時間暫停",
    closed: "當日營業已結束",
  }[state.phase];
  $("#cash").textContent = money(state.cash);
  $(".company-cash").classList.toggle("negative", state.cash < 0);
  $("#property-badge").textContent = v.owned ? "自置物業・免租" : "租賃物業";
  $("#property-badge").classList.toggle("owned", v.owned);
  $("#game-clock").textContent = clock(Math.max(0, state.minute));
  $("#day-progress").style.width = (state.elapsed / E.DAY_SECONDS) * 100 + "%";
  $("#time-note").textContent =
    state.phase === "planning"
      ? "1× 營業日 3 分鐘 · 事件停頓另計"
      : state.phase === "closed"
        ? "結算已完成，下一日由你開始。"
        : state.phase === "event"
          ? "處理事件期間，所有分店時間暫停。"
          : state.paused
            ? "已暫停 · 按繼續恢復營業"
            : "1× 營業日 3 分鐘 · 可加速，不能跳事件";
  $("#pause-button").hidden = state.phase !== "running";
  $("#pause-button").textContent = state.paused ? "▶ 繼續" : "Ⅱ 暫停";
  $("#main-action").hidden = state.phase === "running";
  $('#main-action').textContent=state.phase==='closed'?'翌日準備':state.phase==='event'?'處理事件':state.branches.some(C.operational)?'開始營業':'建造戲院';
  $('#main-action').disabled=!saveReady;
  $('#pause-button').disabled=!saveReady;
  $('#pause-button').textContent=state.paused?'繼續營業':'暫停';
  $('#active-branch-name').textContent=v.name;
  $('#cycle-speed').textContent=state.speed+'×';
  $('#cycle-speed').setAttribute('aria-label',`營業速度 ${state.speed} 倍，點選切換`);
  for (const button of document.querySelectorAll("[data-speed]"))
    button.classList.toggle(
      "active",
      Number(button.dataset.speed) === state.speed,
    );
  $("#branch-count").textContent = `0${state.branches.length} / 02`;
  $("#branch-buttons").innerHTML = state.branches
    .map(
      (v) =>
        `<button class="branch-button ${v.id === state.activeBranch ? "active" : ""}" data-action="branch" data-id="${v.id}"><b>${v.id ? "觀塘 · 光影東岸" : "旺角 · 光影戲院"}</b><small>${v.owned ? "自置物業" : `每日租金 ${money(v.rent)}`} · ${v.staff.length} 位員工</small></button>`,
    )
    .join("");
  $("#second-branch").hidden = state.branches.length >= 2;
}
function showStatus(p) {
  if (p.cancelled) return "已取消";
  if (!p.booked) return "未開場";
  if (state.minute < p.start + E.movie(p.movie).length + p.delay)
    return `放映中 · ${p.served} 人`;
  return `已散場 · ${p.served} 人`;
}
function nowShows() {
  const v = b(),
    shows = (state.phase === "planning" ? v.programme : v.shows)
      .slice()
      .sort((a, b) => a.start - b.start);
  return (
    shows
      .map(
        (p) =>
          `<div class="show-row ${p.cancelled ? "cancelled" : p.booked && state.minute < p.start + E.movie(p.movie).length + p.delay ? "playing" : ""}"><span class="show-time">${clock(p.start)}</span><div class="show-info"><b>${esc(E.movie(p.movie).title)}</b><small>${p.hall + 1} 號廳 · ${money(p.price)} · ${state.phase === "planning" ? "2D" : showStatus(p)}</small></div><span class="show-dot"></span></div>`,
      )
      .join("") ||
    '<div class="empty-state" style="padding:30px 10px">尚未安排場次</div>'
  );
}
function zoneInfo() {
  const venue=b(),room=C.ROOMS.find(r=>r.id===selectedZone);
  if(venue.map&&selectedBlock)return constructionSummary(state,venue,selectedBlock);
  if(room&&!C.hasRoom(venue,room.id))return roomConstruction(state,venue,room);
  if(!room&&venue.map&&!C.operational(venue))return constructionSummary(state,venue);
  if(!room)return `<p class="eyebrow">THE NEXT GOOD SHOW</p><h2>今日，由你話事。</h2><p>先檢查排片同票價，再為戲院開燈。日常交畀員工，突發時先決定點樣救場。</p><div class="ready-row"><span>放映安排</span><b>${venue.programme.length} 場</b></div><div class="ready-row"><span>當值團隊</span><b>${venue.staff.length} 位</b></div><div class="ready-row"><span>已建影廳</span><b>${venue.seats.filter((_,h)=>C.hasRoom(venue,`hall${h+1}`)).join(" + ")} 席</b></div><button class="primary" data-action="navigate" data-target="schedule">檢查今日排片 →</button><p class="zone-tip">點選地圖區域，查看營運狀態。</p>`;
  const hall=room.id.startsWith('hall')?Number(room.id.slice(-1))-1:null;
  let title=room.name,description='',detail='',target='investment',actionText='查看裝修';
  if(hall!==null){
    const shows=(planning()?venue.programme:venue.shows).filter(p=>p.hall===hall&&!p.cancelled).sort((a,b)=>a.start-b.start);
    const current=shows.find(p=>p.booked&&state.minute>=p.start&&state.minute<p.start+E.movie(p.movie).length+p.delay),next=shows.find(p=>p.start>state.minute),show=current||next;
    description=hallUnderRepair(venue,state,hall)?'維修期間暫停入場，其餘影廳照常營業。':'八排階梯座席，後排升高 2.1 米。';
    detail=`<div class="ready-row"><span>可用座位</span><b>${venue.seats[hall]} 席</b></div><div class="ready-row"><span>${current?'本場入座':'今日場次'}</span><b>${current?current.served+' 人':shows.length+' 場'}</b></div>${show?`<div class="zone-film"><small>${current?'正在放映':'下一場 '+clock(show.start)}</small><strong>《${esc(E.movie(show.movie).title)}》</strong><span>票價 ${money(show.price)} · ${E.movie(show.movie).type}</span></div>`:'<p>暫時未有場次，安排一齣好戲吧。</p>'}`;
    target='schedule';actionText='管理影廳排片';
  }else if(room.id==='tickets'){description='有人售票與自助機分流，客人經獨立入口排隊。';detail=`<div class="ready-row"><span>售票員工</span><b>${venue.staff.filter(p=>p.role==='tickets').length} 位</b></div><div class="ready-row"><span>今日票房留成</span><b>${money(venue.ledger.gross-venue.ledger.share)}</b></div>`;target='staff';actionText='安排售票人手';
  }else if(room.id==='snacks'){description='按售出份數自動補貨；售價、人手同出餐能力一樣重要。';detail=`<div class="ready-row"><span>小食員工</span><b>${venue.staff.filter(p=>p.role==='snacks').length} 位</b></div><div class="ready-row"><span>今日小食毛利</span><b>${money(venue.ledger.foodRevenue-venue.ledger.foodCost)}</b></div>`;target='snacks';actionText='調整小食與售價';
  }else if(room.id==='staff'){description='清潔車、儲物櫃及用品集中在後勤室。合理分工，減少下一場的延誤。';detail=`<div class="ready-row"><span>清潔員工</span><b>${venue.staff.filter(p=>p.role==='cleaning').length} 位</b></div><div class="ready-row"><span>今日延誤</span><b>${venue.ledger.delay} 分鐘</b></div>`;target='staff';actionText='管理員工團隊';
  }else description='獨立入口連接大堂，設施與公共通道分開，保持動線暢通。';
  return `<p class="eyebrow">CINEMA OPERATIONS</p><h2>${title}</h2><p>${description}</p>${detail}<button class="primary" data-action="navigate" data-target="${target}">${actionText} →</button><button class="text-button" data-action="clear-zone">返回營運摘要</button>`;
}
function selectZone(id){
 selectedBlock=null;
 if(id?.startsWith('block:')){if(view!=='investment')return;selectedBlock=id.slice(6).split(',').map(Number);id=null;}
 selectedZone=id;if(renderer){renderer.selected=id;renderer.dirty=true;}
 if(view==='overview'&&$('#zone-inspector')){$('#zone-inspector').outerHTML=zoneDrawer();}
 if(view==='investment'&&$('#construction-detail'))$('#construction-detail').innerHTML=zoneInfo();
}
function zoneDrawer(){const room=C.ROOMS.find(r=>r.id===selectedZone);return `<aside class="zone-inspector" id="zone-inspector" ${!room?'hidden':''}><div class="zone-heading" data-swipe-dismiss><span class="swipe-grip" aria-hidden="true"></span><h2>${room?.name||''}</h2><button data-action="clear-zone" aria-label="關閉區域詳情">×</button></div><div class="zone-body">${room?zoneInfo():''}</div></aside>`}
function overview(){return `<div class="game-map"><div class="scene-wrap"><canvas id="cinema" width="1440" height="1000" tabindex="0" aria-label="像素戲院地圖，可單指拖動、雙指縮放，點選區域查看詳情"></canvas></div><div class="map-controls" data-map-controls aria-label="地圖縮放"><button data-action="zoom-out" aria-label="縮小地圖">−</button><button data-action="zoom-in" aria-label="放大地圖">＋</button></div>${zoneDrawer()}</div>`}
function newsHTML() {
  return state.news
    .slice(0, 3)
    .map(
      (n) =>
        `<p><span class="news-day">DAY ${String(n.day).padStart(2, "0")} · ${clock(n.minute)}</span>${esc(n.text)}</p>`,
    )
    .join("");
}
function schedule() {
  const v = b(),
    errors = E.validateProgramme(state, v.programme,v.id),
    shows = state.phase === "planning" ? v.programme : v.shows;
  return `<div class="section-toolbar"><div class="button-row"><button class="secondary small-button" data-action="copy-programme" ${disabled()}>複製昨日</button><button class="secondary small-button" data-action="suggest-programme" ${disabled()}>套用建議排片</button><button class="primary small-button" data-action="add-show" ${disabled()}>＋ 加入場次</button></div></div>${!planning() ? '<div class="notice">營業期間日常排片已鎖定；突發事件仍可透過補救選項換片。</div>' : ""}${errors.length ? `<div class="notice warning">${errors.map(esc).join("<br>")} <button class="text-button" data-action="remove-banned" ${disabled()}>移除停映場次</button></div>` : ""}<section class="panel"><div class="panel-header"><h2>${esc(v.name)}・每日排片</h2><span class="muted" style="font-size:9px">共 ${shows.length} 場</span></div><div class="timeline-scroll"><div class="timeline-panel"><div class="timeline-hours">${Array.from({ length: 14 }, (_, i) => `<span style="left:${(i / 13) * 100}%">${String(11 + i).padStart(2, "0")}:00</span>`).join("")}</div>${[
    0, 1,
  ]
    .map(
      (h) =>
        `<div class="hall-row"><div class="hall-label">${h + 1} 號影廳<small>${v.seats[h]} 席 · 普通 2D</small></div><div class="timeline-track">${shows
          .filter((p) => p.hall === h)
          .map(
            (p) =>
              `<span class="clean-buffer" style="left:${((p.start + E.movie(p.movie).length) / E.DAY_MINUTES) * 100}%;width:${(15 / E.DAY_MINUTES) * 100}%"></span><button class="session ${p.cancelled ? "cancelled" : ""}" style="left:${(p.start / E.DAY_MINUTES) * 100}%;width:${(E.movie(p.movie).length / E.DAY_MINUTES) * 100}%;--movie-color:${E.movie(p.movie).color}" data-action="edit-show" data-id="${esc(p.id)}" title="${esc(E.movie(p.movie).title)} ${clock(p.start)} ${money(p.price)}"><small>${clock(p.start)}–${clock(p.start + E.movie(p.movie).length)}</small><b>${esc(E.movie(p.movie).title)}</b><span>${money(p.price)} · ${p.cancelled ? "已取消" : E.movie(p.movie).length + " 分鐘"}</span></button>`,
          )
          .join("")}</div></div>`,
    )
    .join(
      "",
    )}</div></div><div class="legend" style="padding-bottom:20px"><span><i></i>電影放映</span><span>▨ 清潔緩衝 15 分鐘</span><span>先處理重疊，先可以開始營業。</span></div></section>`;
}
function films() {
  const pool = E.MOVIES.filter((m) =>
    filmFilter === "available"
      ? m.release <= state.day
      : filmFilter === "upcoming"
        ? m.release > state.day && m.release <= state.day + 14
        : true,
  );
  return `<div class="section-toolbar"><p>第 ${Math.ceil(state.day / 7)} 週片單 · 下次更新：第 ${(Math.floor((state.day - 1) / 7) + 1) * 7 + 1} 日<br>大片抽成較高；小眾口碑片可以長賣。</p><div class="film-filters">${[
    ["available", "上映中"],
    ["upcoming", "即將上映"],
    ["all", "全部電影"],
  ]
    .map(
      ([key, label]) =>
        `<button class="filter-button ${filmFilter === key ? "active" : ""}" data-action="film-filter" data-filter="${key}">${label}</button>`,
    )
    .join(
      "",
    )}</div></div><div class="film-grid">${pool.map((m) => `<button class="film-card ${m.release > state.day || E.isBanned(state, m.id) ? "unavailable" : ""}" data-action="movie-detail" data-id="${m.id}"><div class="poster-wrap" style="--movie-color:${m.color}"><canvas data-movie="${m.id}" width="240" height="360" aria-label="${esc(m.title)}原創戲仿海報"></canvas><span class="film-rating">★ ${m.rating.toFixed(1)}</span>${E.isBanned(state, m.id) ? '<span class="new-tag">暫時停映</span>' : m.release > state.day ? `<span class="new-tag">第 ${m.release} 日上映</span>` : state.day - m.release < 7 ? '<span class="new-tag">本週熱映</span>' : ""}</div><div class="film-body"><b>${esc(m.title)}</b><p>${m.type} · ${m.length} 分鐘</p><div class="film-footer"><span>片商抽成 ${Math.round(m.share * 100)}%</span><em>${m.release > state.day ? "即將上映" : `熱度 ${Math.round(E.heat(m, state.day) * 100)}`}</em></div></div></button>`).join("")}</div>`;
}
function staff() {
  const v = b();
  return `<div class="section-toolbar"><p>自動排班・職員能力 ${E.roleSkill(v, "tickets").toFixed(1)} / ${E.roleSkill(v, "snacks").toFixed(1)} / ${E.roleSkill(v, "cleaning").toFixed(1)}<br>對應售票、小食、清潔；專長以外崗位效率為 78%。</p><button class="primary small-button" data-action="hire" ${disabled()}>＋ 招聘員工 · $800</button></div><div class="staff-summary">${Object.entries(
    E.ROLES,
  )
    .map(
      ([role, label]) =>
        `<div class="summary-chip">${label}團隊<b>${v.staff.filter((p) => p.role === role).length} 人</b></div>`,
    )
    .join("")}</div><div class="staff-grid">${v.staff
    .map(
      (p) =>
        `<section class="card staff-card"><div class="staff-heading"><div class="avatar" aria-hidden="true"></div><div><b>${esc(p.name)}</b><p>專長・${E.ROLES[p.special]} / 日薪 ${money(p.wage)}</p></div></div><span class="stars">${"★".repeat(p.skill)}<span style="opacity:.2">${"★".repeat(5 - p.skill)}</span></span><label>目前崗位<select data-role-staff="${p.id}" aria-label="${esc(p.name)}崗位" ${disabled()}>${Object.entries(
          E.ROLES,
        )
          .map(
            ([role, label]) =>
              `<option value="${role}" ${p.role === role ? "selected" : ""}>${label}</option>`,
          )
          .join(
            "",
          )}</select></label><div class="button-row"><button class="secondary small-button" data-action="train" data-id="${p.id}" ${!planning() || p.skill >= 5 ? "disabled" : ""}>${p.skill >= 5 ? "已達最高能力" : `培訓 · ${money(p.skill * 900)}`}</button><button class="subtle-button" data-action="dismiss" data-id="${p.id}" ${disabled()}>解除聘用</button></div></section>`,
    )
    .join(
      "",
    )}</div><p class="locked-message">培訓提升能力，同時增加日薪 $40。招聘後可自行調整崗位。</p>`;
}
function snacks() {
  const v = b();
  return `<div class="notice">食品自動供貨，沒有手動訂貨或庫存損耗。人手、櫃位產能同售價會影響銷量。</div><div class="food-grid">${E.FOODS.map((f, i) => `<section class="card food-card"><div class="food-art" style="background:${i === 0 ? "#eddfbc" : i === 1 ? "#dce6e0" : "#eddfd1"}">${["🍿", "🥤", "🌭"][i]}</div><p class="eyebrow">${["POPCORN", "SOFT DRINK", "HOT DOG"][i]}</p><h2>${f.name}</h2><p>每份成本 ${money(f.cost)}<br>${v.foodUnlocked[i] ? "供應中・按實際銷量扣成本" : "未解鎖・需加裝食品設備"}</p>${v.foodUnlocked[i] ? stepper(f.name+'售價',`<input type="number" inputmode="numeric" min="${f.cost+1}" max="150" value="${v.foods[i]}" data-food-price="${i}" aria-label="${f.name}售價" ${disabled()}>`,1) : `<button class="secondary" data-action="unlock-food" ${disabled()}>解鎖供應 · $3,500</button>`}</section>`).join("")}</div><div class="loan-box"><span>今日小食銷量：${v.ledger.snackUnits.map((n, i) => `${E.FOODS[i].name} ${n} 份`).join(" / ")}<br>增加小食員工或升級服務區，可以應付更大人流。</span><button class="text-button" data-action="navigate" data-target="investment">升級服務區 ↗</button></div>`;
}
function investment() {
  const v = b();
  if(investmentSection==='build')return `<section class="construction-guide" id="construction-detail">${zoneInfo()}</section>${constructionPanel(state,v)}`;

  return `<div class="investment-grid"><section class="card property-card ${v.owned ? "owned" : ""}"><p class="eyebrow">${esc(v.district)} / PROPERTY</p><span class="property-stamp">${v.owned ? "自置物業" : "租賃中"}</span><h2>${v.owned ? "呢間戲院，屬於你。" : "買斷自己的戲院。"}</h2><p>${v.owned ? "物業已買斷，往後免租。音響、清潔與設備保養仍然需要維護費。" : `目前每日租金 ${money(v.rent)}。買斷後永久免租，保留維護支出；你亦可以先開第二間分店。`}</p><span class="price">${v.owned ? "免租經營" : money(E.PROPERTY_PRICE[v.id])}</span><button class="primary" data-action="buy-property" ${v.owned || !planning() ? "disabled" : ""}>${v.owned ? "物業已買斷" : "買斷物業"}</button></section><section class="card property-card"><p class="eyebrow">KWUN TONG / EXPANSION</p><h2>${state.branches.length > 1 ? "觀塘 · 光影東岸" : "為第二間戲院亮燈。"}</h2><p>${state.branches.length > 1 ? "兩間戲院共用公司資金與日期。排片、票價、人手同收支獨立，由你親自掌握。" : "在觀塘開設新分店，由一塊地板起步及四位員工協助籌備。建好基本設施後才營業，每日租金 $1,550；籌備不阻礙原店營業。"}</p><span class="price">${state.branches.length > 1 ? "第二間分店已開業" : money(E.BRANCH_PRICE)}</span><button class="primary" data-action="${state.branches.length > 1 ? "branch" : "open-branch"}" data-id="1" ${!planning() && state.branches.length < 2 ? "disabled" : ""}>${state.branches.length > 1 ? "切換到觀塘店" : "開設第二間分店"}</button></section></div><div class="section-toolbar" style="margin-top:28px"><p>區域配置 · 各店獨立建造；逐格鋪地，房間成區完成。<br>投資在營業前安排，效果由當日開始。</p></div><div class="upgrade-grid">${Object.entries(
    E.UPGRADES,
  )
    .map(
      ([key, u], i) =>
        `<section class="card upgrade-card"><span class="zone">ZONE ${["A · 大堂", "B · 影廳", "C · 小食部", "D · 座位"][i]}</span><h3>${u.name}</h3><p>${u.description}</p><div class="level">${Array.from({ length: 3 }, (_, j) => `<i class="${j < v.upgrades[key] ? "filled" : ""}"></i>`).join("")} ${v.upgrades[key]} / 3</div><button class="secondary small-button" data-action="upgrade" data-key="${key}" ${!planning() || v.upgrades[key] >= 3 ? "disabled" : ""}>${v.upgrades[key] >= 3 ? "已達最高等級" : `升級 · ${money(u.cost * (v.upgrades[key] + 1))}`}</button></section>`,
    )
    .join(
      "",
    )}</div><div class="loan-box"><span>${state.loan > 0 ? `周轉貸款尚餘 ${money(state.loan)}；有現金時每日償還 $200。` : "資金周轉有困難？可申請 $20,000 貸款，總還款 $22,000，每日償還 $200。"}<br>這是試玩版的翻身機制，經濟值仍待平衡。</span><button class="secondary small-button" data-action="loan" ${!planning() || state.loan > 0 ? "disabled" : ""}>${state.loan > 0 ? "還款中" : "申請周轉貸款"}</button></div>`;
}
function report() {
  if (!state.history.length)
    return `<section class="panel empty-state"><p class="eyebrow">THE FIRST CURTAIN CALL</p><h2>第一份日報，等你開場。</h2><p>完成一日營業後，呢度會列出票房、分帳、小食、人工、租金同維護。<br>兩間分店各自計算，方便比較營運。</p><button class="secondary" data-action="navigate" data-target="overview">返回戲院總覽</button></section>`;
  const r = state.history[Math.min(reportIndex, state.history.length - 1)],
    rows = r.rows,
    fields = [
      ["總票房", "gross", 1],
      ["片商分帳", "share", -1],
      ["小食收入", "foodRevenue", 1],
      ["小食成本", "foodCost", -1],
      ["員工薪金", "wages", -1],
      ["物業租金", "rent", -1],
      ["維護、保養及清潔耗材", "maintenance", -1],
      ["事件處理費", "eventCost", -1],
    ];
  const aggregate = (key) => rows.reduce((n, row) => n + row.ledger[key], 0);
  return `<div class="section-toolbar"><p>第 ${r.day} 日已結算 · ${rows.length} 間戲院<br>投資支出另列，不混入營運淨利。</p><select class="report-select" id="report-day" aria-label="選擇日報日期">${state.history.map((r, i) => `<option value="${i}" ${i === reportIndex ? "selected" : ""}>第 ${r.day} 日營運報告</option>`).join("")}</select></div><div class="report-layout"><section class="panel" style="overflow:auto"><table class="report-table"><thead><tr><th>收支項目</th>${rows.map((row) => `<th>${row.id ? "觀塘店" : "旺角店"}</th>`).join("")}<th>公司合計</th></tr></thead><tbody>${fields.map(([label, key, sign]) => `<tr class="${sign < 0 ? "deduction" : ""}"><td>${label}</td>${rows.map((row) => `<td>${sign < 0 ? "− " : ""}${money(row.ledger[key])}</td>`).join("")}<td>${sign < 0 ? "− " : ""}${money(aggregate(key))}</td></tr>`).join("")}<tr class="total"><td>營運淨利</td>${rows.map((row) => `<td>${money(row.net)}</td>`).join("")}<td>${money(r.net)}</td></tr><tr><td>入場人次</td>${rows.map((row) => `<td>${row.ledger.admissions} 人</td>`).join("")}<td>${aggregate("admissions")} 人</td></tr><tr><td>未能服務需求</td>${rows.map((row) => `<td>${row.ledger.lost} 人</td>`).join("")}<td>${aggregate("lost")} 人</td></tr><tr><td>當日投資</td><td colspan="${rows.length + 1}">− ${money(r.investment)}</td></tr>${r.financing ? `<tr><td>貸款流入</td><td colspan="${rows.length + 1}">${money(r.financing)}</td></tr>` : ""}<tr><td>貸款償還</td><td colspan="${rows.length + 1}">− ${money(aggregate("loanPayment"))}</td></tr><tr class="grand"><td>日終公司現金</td><td colspan="${rows.length + 1}">${money(r.closingCash)}</td></tr></tbody></table></section><div class="right-stack"><section class="panel"><div class="panel-header"><h2>觀眾組成</h2></div><div class="cohort-bar">${E.COHORTS.map(
    (g, i) => {
      const count = rows.reduce((n, row) => n + row.ledger.groups[i], 0),
        total = aggregate("admissions");
      return `<div class="cohort-row"><label><span>${g.name}</span><span>${count} 人</span></label><div class="cohort-track"><i style="width:${total ? (count / total) * 100 : 0}%"></i></div></div>`;
    },
  ).join(
    "",
  )}</div></section><section class="panel"><div class="news"><p>未能服務需求包括滿座、人手不足、延誤、停映及維修取消。<br><br>可透過錯開場次、調整票價、配置人手同設備升級改善。</p></div></section></div></div>`;
}
const groupFor=v=>['overview'].includes(v)?'map':['schedule','movies'].includes(v)?'programme':['staff','snacks'].includes(v)?'operations':['strategy','report'].includes(v)?'business':'investment';
function workHeader(){const g=groupFor(view),sets={programme:[['schedule','時間表'],['movies','電影庫']],operations:[['staff','員工'],['snacks','小食售價']],business:[['strategy:ratings','口碑定位'],['strategy:maintenance','設備維護'],['report','收支日報']],investment:[['investment:assets','設施與物業'],['investment:build','擴建與建造']]};
 return g==='map'?'':`<h1>${{programme:'今日排片',operations:'日常營運',business:'經營狀況',investment:'投資與擴張'}[g]}</h1><div class="work-tabs" aria-label="工作分類">${sets[g].map(([key,text])=>{const [v,section]=key.split(':');const active=v===view&&(!section||section===(v==='strategy'?strategySection:investmentSection));return `<button data-view="${v}" ${section?`data-section="${section}"`:''} aria-pressed="${active}" class="${active?'active':''}">${text}</button>`}).join('')}</div>`}
function filterStrategy(){if(view!=='strategy')return;for(const el of $('#view-content').children){if(!el.matches('section'))continue;el.hidden=strategySection==='ratings'?el.matches('.strategy-cleaning,.equipment-panel,.strategy-forecast,.cash-planning'):el.matches('.strategy-profile,.review-panel');}}
function navigate(target,section){view=target;if(view==='strategy')strategySection=section||'ratings';if(view==='investment')investmentSection=section||'assets';$('#utilities').hidden=true;$('#more-button').setAttribute('aria-expanded','false');render();}
function render() {
  updateHeader();
  const [l, title, description] = labels[view];
  $("#page-eyebrow").textContent = l;
  $("#page-title").textContent = title;
  $("#page-description").textContent = description;
  for (const n of document.querySelectorAll("[data-view]"))
    n.classList.toggle("active", n.dataset.view === view);
  const animation = renderer?.animation || 0;
  if(renderer&&mapBranch===state.activeBranch)savedCamera={...renderer.camera};
  const camera=mapBranch===state.activeBranch?savedCamera:null;
  renderer?.dispose?.();
  $("#view-content").innerHTML = {
    overview,
    schedule,
    movies: films,
    staff,
    snacks,
    investment,
    strategy:()=>strategyView(state,b()),
    report,
  }[view]();
  $('#main-content').classList.toggle('map-view',view==='overview');
  $('#work-header').innerHTML=workHeader();$('#work-header').hidden=view==='overview';
  for(const n of document.querySelectorAll('[data-group]')){const active=n.dataset.group===groupFor(view);n.classList.toggle('active',active);n.setAttribute('aria-pressed',String(active));}
  if(view==='staff')$('#view-content').insertAdjacentHTML('beforeend',operationsPanel(state,b()));
  filterStrategy();
  if(view==='investment'&&investmentSection==='assets')$('#view-content').insertAdjacentHTML('afterbegin',cashPanel(state));
  if(view==='report'&&state.history.length){const row=state.history[Math.min(reportIndex,state.history.length-1)].rows.find(r=>r.id===b().id);if(row?.review)$('#view-content').insertAdjacentHTML('beforeend',reviewPanel(row.review,'本日分項體驗'))}
  if(view==='schedule'&&planning())$('#view-content').insertAdjacentHTML('beforeend',forecastPanel(state,b()));
  if (view === "overview" && atlas) {
    renderer = new CinemaRenderer($("#cinema"), atlas, images, {onSelect: selectZone, camera});
    mapBranch=state.activeBranch;renderer.selected=selectedZone;
    if($("#map-zoom"))$("#map-zoom").textContent=Math.round(renderer.camera.zoom*100)+"%";
    renderer.animation = animation;
    renderer.render(state);
  } else renderer = null;
  hydratePosters($("#view-content"));
  renderedPhase = state.phase;
}
function liveUpdate(){updateHeader();if(view==='overview'&&selectedZone&&$('#zone-inspector .zone-body'))$('#zone-inspector .zone-body').innerHTML=zoneInfo();if(view==='staff'&&$('#live-operations'))$('#live-operations').outerHTML=operationsPanel(state,b());}
function showForm(id = null, preferredMovie = null, draft = null) {
  if (!planning()) {
    toast("日常排片只可以喺營業前更改。", true);
    return;
  }
  const existing = b().programme.find((p) => p.id === id);
  const firstHall = [0, 1].find(h => C.hasRoom(b(), `hall${h+1}`));
  if (firstHall === undefined) { toast("先建好影廳，再安排放映場次。", true); return; }
  const p = draft || existing || {
    id: null,
    hall: firstHall,
    start: 0,
    movie: preferredMovie || E.availableMovies(state)[0].id,
    price: 88,
  };
  openModal(`<div class="modal-body programme-sheet">${modalHeader('排片',existing?'編輯場次':'新增場次')}<form id="programme-form" data-id="${esc(p.id||'')}"><div class="modal-form">
  <label>電影<select name="movie" required>${E.availableMovies(state).map(m=>`<option value="${m.id}" ${p.movie===m.id?'selected':''}>${esc(m.title)} · ${m.length} 分</option>`).join('')}</select></label>
  <div class="touch-field"><span>影廳</span><div class="hall-choice" role="group" aria-label="放映影廳"><input type="hidden" name="hall" value="${p.hall}">${[0,1].filter(h=>C.hasRoom(b(),`hall${h+1}`)).map(h=>`<button type="button" data-action="choose-hall" data-id="${h}" aria-pressed="${p.hall===h}" class="${p.hall===h?'primary':'secondary'}">影廳 ${h+1}</button>`).join('')}</div></div>
  ${stepper('開場時間',`<input name="time" type="time" min="11:00" max="23:00" step="300" value="${clock(p.start)}" required>`,15)}
  ${stepper('票價（HKD）',`<input name="price" aria-label="票價" type="number" inputmode="numeric" min="20" max="300" step="1" value="${p.price}" required>`,5)}<input type="hidden" name="format" value="2D"></div>
  <div class="programme-details"><details><summary>預測詳情</summary><div id="programme-preview" aria-live="polite"></div></details><div id="form-error" role="alert"></div></div>
  <div class="modal-actions">${existing?`<button type="button" class="subtle-button danger" data-action="delete-show" data-id="${esc(p.id)}">刪除</button>`:''}<button type="button" class="secondary" data-action="close">取消</button><button class="primary" type="submit">儲存場次</button></div></form></div>`);
  refreshProgrammePreview();
}
let previewTimer=null;
function refreshProgrammePreview(){
 const form=$('#programme-form');if(!form)return;
 const f=new FormData(form),id=form.dataset.id||'preview-draft',time=String(f.get('time')).split(':').map(Number);
 const candidate={id,hall:Number(f.get('hall')),start:time[0]*60+time[1]-E.OPEN_MINUTE,movie:f.get('movie'),price:Number(f.get('price')),format:'2D'};
 const programme=b().programme.filter(p=>p.id!==form.dataset.id).concat(candidate);
 $('#programme-preview').innerHTML=draftForecast(state,b(),programme,id);
}
document.addEventListener('input',e=>{if(!e.target.closest('#programme-form'))return;clearTimeout(previewTimer);previewTimer=setTimeout(refreshProgrammePreview,200)});
document.addEventListener('change',e=>{if(e.target.closest('#programme-form')){clearTimeout(previewTimer);refreshProgrammePreview()}});

function movieDetail(id) {
  const m = E.movie(id);
  if (!m) return;
  const good = E.COHORTS.filter((g) => g.pref[m.genre] >= 1.2);
  openModal(
    `<div class="modal-body">${modalHeader("FILM DISTRIBUTION", esc(m.title))}<div class="movie-detail"><canvas width="240" height="360" data-movie="${m.id}"></canvas><div><p>${m.type} · ${m.length} 分鐘<br>口碑 ★ ${m.rating.toFixed(1)} / 10<br>片商：${esc(m.studio)}<br>票房抽成：${Math.round(m.share * 100)}%<br>${m.release > state.day ? "第 " + m.release + " 日上映" : E.isBanned(state, m.id) ? "停映至第 " + state.bans[m.id] + " 日" : "已上映 " + (state.day - m.release + 1) + " 日"}</p><p>${esc(m.tagline)}</p><div class="heat-bar"><span style="width:${Math.min(100, E.heat(m, state.day) * 50)}%"></span></div><p>目前熱度 ${Math.round(E.heat(m, state.day) * 100)} · ${m.rating >= 8.7 ? "口碑型，退熱較慢" : "上映後熱度逐步回落"}</p></div></div><div class="tag-list">${good.map((g) => `<span class="tag">${g.name}偏好</span>`).join("")}</div><p>高票房未必等於高淨利：別忘記片商分帳、人手同小食服務能力。</p><div class="modal-actions"><button class="secondary" data-action="close">返回電影庫</button><button class="primary" data-action="movie-add" data-id="${m.id}" ${!planning() || m.release > state.day || E.isBanned(state, m.id) ? "disabled" : ""}>加入排片</button></div></div>`,
  );
}
function help(welcome = false) {
  if(!saveReady&&readStored())welcome=true;
  if(welcome&&readStored()){
    const backup=recoveryCandidate();
    openModal(`<div class="modal-body">${modalHeader('LUMEN CINEMA',saveReady?'歡迎返嚟。':'存檔未能讀取')}${saveReady?`<p>第 ${state.day} 日 · ${esc(b().name)}。已還原建築、排片及資金${state.phase==='running'?'，營業已暫停':''}。</p>`:`<p role="alert">${esc(lastLoadError)}。原存檔會保留，不會以新局覆蓋。</p>`}<div class="modal-actions"><button class="primary" data-action="resume-save">${saveReady?'繼續已儲存進度':'重試讀取'}</button>${backup?'<button class="secondary" data-action="recover-save">查看較早備份</button>':''}<button class="subtle-button danger" data-action="reset-prompt">重新開局</button></div></div>`);
    return;
  }
  openModal(
    `<div class="modal-body">${modalHeader("WELCOME TO LUMEN CINEMA", welcome ? "歡迎做戲院老闆。" : "好戲點樣開始？")}<p>現代香港，一間租用戲院。你負責安排營運，員工負責日常工作，突發時再決定要唔要親自救場。</p><div class="help-steps"><div class="help-step"><b>01</b><span><strong>由右下角地板建造影院</strong>在「投資 → 擴建與建造」逐格鋪地，再建售票、小食、洗手間及影廳；建好的影廳會提供建議排片，可再調整。</span></div><div class="help-step"><b>02</b><span><strong>睇住戲院自己運作</strong>正常速度一日 3 分鐘，可用 2×／4× 加速，不能跳到事件。離開分頁會自動暫停。</span></div><div class="help-step"><b>03</b><span><strong>親自救場，再投資下一步</strong>一般每日每店 0–2 次事件。小遊戲可交員工；儲錢買斷免租，或開設觀塘分店。</span></div></div><p>進度儲存於本機瀏覽器。價格、日長同獎勵目前係試玩設定；可以拖曳及縮放地圖，點選區域查看營運狀態。</p><div class="modal-actions">${welcome && readStored() ? '<button class="secondary" data-action="resume-save">繼續已儲存進度</button>' : ""}${!welcome ? '<button class="subtle-button danger" data-action="reset-prompt">重新開局</button>' : ""}<button class="primary" data-action="close">${welcome ? "開始籌備第一日" : "明白，繼續經營"}</button></div></div>`,
  );
}
function recoveryCandidate(){
  const candidates=[];
  for(const suffix of ['before-flow-v1','before-strategy-v1','before-map-v1','before-reset','before-recovery'])try{
    const raw=localStorage.getItem(`${STORAGE}-${suffix}`);if(!raw)continue;
    const saved=E.loadGame(raw);if(!saved.branches.some(v=>v.map.floors.length>1||v.map.built.length))continue;
    candidates.push({raw,state:saved,time:Number(JSON.parse(raw).savedAt)||0});
  }catch{}
  return candidates.sort((a,b)=>b.state.day-a.state.day||b.time-a.time)[0]||null;
}
function showRecovery(){
  const candidate=recoveryCandidate();if(!candidate){toast('未找到可讀取的較早備份。',true);return;}
  pendingRecovery=candidate.raw;const s=candidate.state;
  openModal(`<div class="modal-body">${modalHeader('SAVE RECOVERY','恢復較早備份？')}<p>第 ${s.day} 日 · 資金 ${money(s.cash)}</p><p>${s.branches.map(v=>`${esc(v.name)}：${v.map.built.length} 個區域、${v.map.floors.length} 塊地板`).join('<br>')}</p><p>這是較早的進度，恢復後會回到該時間點。現有存檔會先另存備份。</p><div class="modal-actions"><button class="secondary" data-action="close">取消</button><button class="primary" data-action="commit-recovery">恢復這份備份</button></div></div>`);
}
function showEvent() {
  const e = E.currentEvent(state);
  if (!e) return;
  mini = null;
  const venue = state.branches[e.branch];
  const names = {
    tickets: [
      "🎟",
      "售票人龍突然湧到。",
      "一批客人提早到場。可以交員工接待，或者親自協助售票，減少流失。",
    ],
    snacks: [
      "🍿",
      "小食部忙不過來。",
      "客人想趕在開場前買好小食。親自處理訂單，可以提升短時間出餐能力與加購。",
    ],
    cleaning: [
      "▧",
      "影廳需要緊急清潔。",
      "散場後留下飲品同垃圾。親自清理可以縮短清潔時間，維持戲院口碑。",
    ],
    repair: [
      "⚒",
      `${e.hall + 1} 號影廳突發維修。`,
      "設備故障，需要暫停使用。加急處理可以較快恢復，亦可選擇一般維修或明日再開。",
    ],
    withdrawal: [
      "▥",
      "片商要求臨時下映。",
      `《${E.movie(e.movie)?.title||"指定電影"}》停映至第 ${state.bans[e.movie]} 日。兩店未開場的同片場次都受影響，可換片補救。`,
    ],
    thanks: [
      "✦",
      "謝票場邀請到埠。",
      `《${E.movie(e.movie)?.title||"指定電影"}》主創提出到場謝票。保留已排的指定電影場次，當日剩餘同片場次需求將上升，仍受座位與服務限制。`,
    ],
  };
  const [icon, title, description] = names[e.kind];
  let options = "";
  if (["tickets", "snacks", "cleaning"].includes(e.kind))
    options = `<button class="event-choice" data-action="resolve" data-choice="staff"><div><b>交畀員工處理</b><small>按現有人手服務，毋須玩小遊戲。</small></div><span>自動處理 →</span></button><button class="event-choice primary-choice" data-action="play-mini"><div><b>親自落場幫手</b><small>短時間操作；表現越好，服務改善越大。</small></div><span>20 秒小遊戲 →</span></button>`;
  if (e.kind === "repair")
    options = `<button class="event-choice primary-choice" data-action="resolve" data-choice="urgent"><div><b>加急維修</b><small>45 個遊戲分鐘後恢復開放。</small></div><span>$2,400 →</span></button><button class="event-choice" data-action="resolve" data-choice="standard"><div><b>一般維修</b><small>3 個遊戲小時後恢復。</small></div><span>$800 →</span></button><button class="event-choice" data-action="resolve" data-choice="wait"><div><b>今日停用，明日再開</b><small>其餘影廳照常運作，由例行維護處理。</small></div><span>無額外費 →</span></button>`;
  if (e.kind === "withdrawal") {
    const replacements = E.replacementOptions(state, e);
    options = `<div class="modal-form" style="margin:0"><label class="full">替代電影<select id="replacement-film">${replacements.map((m) => `<option value="${m.id}">${esc(m.title)} · ${m.length} 分鐘</option>`).join("")}</select></label></div><button class="event-choice primary-choice" data-action="resolve" data-choice="replace" ${!replacements.length ? "disabled" : ""}><div><b>協調換片</b><small>保留原場次時間；其他店不合適的場次會取消。需求可能下降。</small></div><span>$400 →</span></button><button class="event-choice" data-action="resolve" data-choice="cancel"><div><b>取消未開場場次</b><small>不能再放映原片；未售出票不會計收入。</small></div><span>接受損失 →</span></button>`;
  }
  if (e.kind === "thanks")
    options = `<button class="event-choice primary-choice" data-action="resolve" data-choice="accept"><div><b>安排指定電影謝票場</b><small>支付接待費，剩餘同片場次需求提升。</small></div><span>$1,200 →</span></button><button class="event-choice" data-action="resolve" data-choice="decline"><div><b>婉拒活動</b><small>保留現有排片，無額外費用。</small></div><span>照常營業 →</span></button>`;
  openModal(
    `<div class="modal-body"><div class="event-art">${icon}</div>${modalHeader("DAY " + state.day + " · " + esc(venue.district) + "分店 / 突發事件", title, false)}<p>${esc(description)}</p><p style="font-size:10px;color:#b69b7d">所有分店時間已暫停，處理後會繼續營業。</p><div class="event-options">${options}</div><div id="event-error"></div></div>`,
    { event: true },
  );
}
function finishEvent(choice, score = 0) {
  const replacement = $("#replacement-film")?.value;
  const error = E.resolveEvent(state, choice, score, replacement);
  if (error) {
    toast(error, true);
    return;
  }
  mini = null;
  closeModal();
  persist();
  render();
}
function startMini() {
  const e = E.currentEvent(state);
  if (!e) return;
  mini = {
    kind: e.kind,
    remaining: 20,
    correct: 0,
    errors: 0,
    round: 0,
    target: 8,
    picks: [],
    cleaned: [],
    request: null,
    done: false,
  };
  const area =
    e.kind === "cleaning"
      ? `<div class="clean-area">${Array.from({ length: 8 }, (_, i) => `<button class="trash" data-action="trash" data-id="${i}" style="left:${13 + (i % 4) * 24 + ((i * 7) % 9)}%;top:${24 + Math.floor(i / 4) * 48 + ((i * 11) % 13)}%" aria-label="清理垃圾 ${i + 1}">${i % 3 === 0 ? "🥤" : i % 3 === 1 ? "🍿" : "▰"}</button>`).join("")}</div>`
      : `<div class="mini-request" id="mini-request"></div>${e.kind === "tickets" ? '<div class="ticket-options" id="ticket-options"></div>' : `<div class="snack-options">${E.FOODS.map((f, i) => (b().foodUnlocked[i] ? `<button data-action="snack-pick" data-id="${i}"><span>${["🍿", "🥤", "🌭"][i]}</span>${f.name}</button>` : "")).join("")}</div>`}`;
  openModal(
    `<div class="modal-body">${modalHeader("親自落場 / " + E.ROLES[e.kind], { tickets: "幫客人揀啱戲票。", snacks: "跟訂單，配好小食。", cleaning: "趕在下一場前清乾淨。" }[e.kind], false)}<div class="mini-head"><span id="mini-score" class="muted" style="font-size:11px">完成 0 / 8</span><span id="mini-timer" class="mini-timer">20 秒</span></div><div class="mini-progress"><i id="mini-progress" style="width:100%"></i></div>${area}<div class="mini-feedback" id="mini-feedback">${e.kind === "cleaning" ? "點擊垃圾清理場地。" : e.kind === "tickets" ? "選擇同客人要求完全相同的戲票。" : "按順序點選訂單上的食品。"}</div><div class="modal-actions"><button class="subtle-button" data-action="mini-staff">交返畀員工處理</button></div></div>`,
    { event: true },
  );
  if (e.kind !== "cleaning") miniQuestion();
}
function miniQuestion() {
  if (!mini || mini.done || mini.kind === "cleaning") return;
  const random = E.rng(state.day * 137 + mini.round * 419 + mini.errors * 53);
  if (mini.kind === "tickets") {
    const available = E.availableMovies(state),
      m = available[Math.floor(random() * available.length)],
      time = clock(120 + Math.floor(random() * 30) * 15),
      count = 1 + Math.floor(random() * 3);
    const target = `《${m.title}》 · ${time} · ${count} 張`;
    mini.request = target;
    const wrongMovie = available.find((x) => x.id !== m.id);
    let options = [
      target,
      `《${wrongMovie.title}》 · ${time} · ${count} 張`,
      `《${m.title}》 · ${time} · ${count === 3 ? 1 : count + 1} 張`,
    ];
    const index = Math.floor(random() * 3);
    [options[0], options[index]] = [options[index], options[0]];
    $("#mini-request").innerHTML = `<small>客人想要</small>${esc(target)}`;
    $("#ticket-options").innerHTML = options
      .map(
        (o, i) =>
          `<button class="ticket-option" data-action="ticket-pick" data-id="${i}">${esc(o)}</button>`,
      )
      .join("");
    mini.options = options;
  } else {
    const foods = E.FOODS.map((f, i) => i).filter((i) => b().foodUnlocked[i]);
    mini.request = [
      foods[Math.floor(random() * foods.length)],
      foods[Math.floor(random() * foods.length)],
    ];
    mini.picks = [];
    $("#mini-request").innerHTML =
      `<small>今張訂單</small>${mini.request.map((i) => ["🍿 爆谷", "🥤 汽水", "🌭 熱狗"][i]).join(" ＋ ")}`;
  }
}
function miniAnswer(correct) {
  if (!mini || mini.done) return;
  if (correct) {
    mini.correct++;
    $("#mini-feedback").textContent = "啱喇！繼續下一位。";
  } else {
    mini.errors++;
    $("#mini-feedback").textContent = "睇清楚，再試一次。";
  }
  $("#mini-score").textContent = `完成 ${mini.correct} / ${mini.target}`;
  if (mini.correct >= mini.target) {
    endMini();
    return;
  }
  if (correct) {
    mini.round++;
    miniQuestion();
  }
}
function endMini() {
  if (!mini || mini.done) return;
  mini.done = true;
  mini.score = Math.max(
    0,
    Math.min(1, (mini.correct - mini.errors * 0.2) / mini.target),
  );
  const stars = Math.round(mini.score * 3);
  openModal(
    `<div class="modal-body">${modalHeader("親自救場 / 完成", "辛苦喇，老闆。", false)}<div class="result-stars">${"★".repeat(stars)}<span style="opacity:.2">${"★".repeat(3 - stars)}</span></div><p style="text-align:center">完成 ${mini.correct} / ${mini.target} · 失誤 ${mini.errors} 次<br>${mini.score > 0 ? "你嘅幫手會提升一段時間的服務能力與口碑。" : "今次未能有效改善服務，之後可以再試。"}</p><div class="notice">收益來自之後實際服務到嘅客人與訂單，會照常扣除片商分帳及食品成本；唔會直接憑空加錢。</div><div class="modal-actions"><button class="primary" data-action="mini-complete">繼續營業 ▶</button></div></div>`,
    { event: true },
  );
}
function confirmInvestment(kind) {
  const venue = b(),
    property = kind === "property";
  openModal(
    `<div class="modal-body">${modalHeader("INVEST IN YOUR STORY", property ? "買斷呢間戲院。" : "開設觀塘分店。")}<p>${property ? `${esc(venue.name)}物業價款為 ${money(E.PROPERTY_PRICE[venue.id])}。買斷後每日免租 ${money(venue.rent)}，但人工、維護及其他成本繼續支付。` : `分店投資 ${money(E.BRANCH_PRICE)}，聘用四位員工並取得起始地板；另需鋪地及建造基本設施（施工指引合共 $30,400）。完成後每日租金 $1,550、日薪合共 $1,220，兩店可同步營業；籌備中的分店不收營業開支。`}</p><div class="notice">公司現金 ${money(state.cash)}<br>投資後餘額 ${money(state.cash - (property ? E.PROPERTY_PRICE[venue.id] : E.BRANCH_PRICE))}<br>一日固定開支建議預留 ${money(E.reserveSummary(state).daily)}${state.cash-(property?E.PROPERTY_PRICE[venue.id]:E.BRANCH_PRICE)<E.reserveSummary(state).daily?" · 投資後周轉預留不足":""}</div><div class="modal-actions"><button class="secondary" data-action="close">再諗一諗</button><button class="primary" data-action="${property ? "commit-property" : "commit-branch"}">確認${property ? "買斷" : "開業"}</button></div></div>`,
  );
}
function action(name, target) {
  if(!saveReady&&!['close','resume-save','reset-prompt','commit-reset','recover-save','commit-recovery'].includes(name)){help(true);return;}
  const id = target?.dataset.id;
  switch (name) {
    case "select-zone": selectZone(id); return;
    case "select-block": selectZone(`block:${target.dataset.x},${target.dataset.y}`); return;
    case "build-floor": result(E.buildFloor(state,b().id,Number(target.dataset.x),Number(target.dataset.y)),"地板已鋪好。"); return;
    case "construct-room": result(E.constructRoom(state,b().id,id),"區域建造完成。"); return;
    case "construction-next": {const step=C.nextStep(b());if(step)result(step.kind==='floor'?E.buildFloor(state,b().id,step.x,step.y):E.constructRoom(state,b().id,step.id),step.label+'完成。');return;}
    case "map-owned": renderer?.focus(); if($("#map-zoom"))$("#map-zoom").textContent="100%"; return;
    case "clear-zone": selectZone(null); return;
    case "zoom-in": renderer?.zoom(.2); if($("#map-zoom"))$("#map-zoom").textContent=Math.round(renderer.camera.zoom*100)+"%"; return;
    case "zoom-out": renderer?.zoom(-.2); if($("#map-zoom"))$("#map-zoom").textContent=Math.round(renderer.camera.zoom*100)+"%"; return;
    case "map-fit": renderer?.fit(); if($("#map-zoom"))$("#map-zoom").textContent="100%"; return;
    case "close":
      closeModal();
      return;
    case "navigate":
      closeModal();
      navigate(target.dataset.target);
      return;
    case "branch":
      state.activeBranch = Number(id);selectedZone=null;selectedBlock=null;savedCamera=null;mapBranch=null;closeModal();
      render();
      persist();
      return;
    case "film-filter":
      filmFilter = target.dataset.filter;
      render();
      return;
    case "add-show":
      showForm();
      return;
    case "edit-show":
      showForm(id);
      return;
    case "movie-detail":
      movieDetail(id);
      return;
    case "movie-add":
      closeModal();
      view = "schedule";
      render();
      showForm(null, id);
      return;
    case "choose-hall": {const group=target.closest('.hall-choice');group.querySelector('input').value=id;for(const button of group.querySelectorAll('button')){const active=button===target;button.setAttribute('aria-pressed',String(active));button.className=active?'primary':'secondary'}refreshProgrammePreview();return;}
    case "delete-show": {const f=new FormData($('#programme-form')),parts=String(f.get('time')).split(':').map(Number);deleteDraft={id,hall:Number(f.get('hall')),movie:f.get('movie'),price:Number(f.get('price')),start:parts[0]*60+parts[1]-660};openModal(`<div class="modal-body">${modalHeader('排片','刪除此場次？',false)}<p>刪除後此時段將留空，預測收入會重新計算。</p><div class="modal-actions"><button class="secondary" data-action="cancel-delete-show">保留場次</button><button class="primary" data-action="commit-delete-show" data-id="${esc(id)}">確認刪除</button></div></div>`);return;}
    case "cancel-delete-show": showForm(deleteDraft.id,null,deleteDraft);return;
    case "commit-delete-show":
      if (
        result(
          E.setProgramme(
            state,
            b().id,
            b().programme.filter((p) => p.id !== id),
          ),
          "場次已移除。",
        )
      )
        closeModal();
      return;
    case "suggest-programme":
      result(
        E.setProgramme(state, b().id, E.suggestProgramme(state, b().id)),
        "已套用建議排片，可再自行調整。",
      );
      return;
    case "copy-programme": {
      const previous = state.history
        .find((r) => r.rows.some((row) => row.id === b().id))
        ?.rows.find((row) => row.id === b().id)?.programme;
      if (!previous) {
        toast("呢間戲院未有上一日排片。", true);
        return;
      }
      const copy = previous.map((p) => ({ ...p, id: "s" + state.nextId++ }));
      result(E.setProgramme(state, b().id, copy), "已複製上一日排片。");
      return;
    }
    case "remove-banned":
      result(
        E.setProgramme(
          state,
          b().id,
          b().programme.filter((p) => !E.isBanned(state, p.movie)),
        ),
        "停映場次已移除，請檢查餘下安排。",
      );
      return;
    case "hire":
      result(E.hire(state, b().id), "新員工已加入，請安排崗位。");
      return;
    case "train":
      result(
        E.train(state, b().id, Number(id)),
        "培訓完成，能力提升；日薪增加 $40。",
      );
      return;
    case "dismiss": {
      if (!planning()) return;
      const p = b().staff.find((p) => p.id === Number(id));
      openModal(
        `<div class="modal-body">${modalHeader("TEAM MANAGEMENT", "解除聘用？")}<p>解除 ${esc(p.name)} 的聘用後，會減少服務能力，同時減少日薪支出 ${money(p.wage)}。首版不另收遣散費。</p><div class="modal-actions"><button class="secondary" data-action="close">保留員工</button><button class="primary" data-action="commit-dismiss" data-id="${p.id}">確認解除聘用</button></div></div>`,
      );
      return;
    }
    case "commit-dismiss":
      if (!planning()) return;
      b().staff = b().staff.filter((p) => p.id !== Number(id));
      closeModal();
      result(null, "已解除聘用。");
      return;
    case "unlock-food":
      result(E.unlockFood(state, b().id), "芝士熱狗開始供應，可自訂售價。");
      return;
    case "cleaning-policy":
      result(E.setCleaning(state,b().id,target.dataset.key),"清潔標準已更新，排片預測會一併調整。");return;
    case "maintenance-form":
      openModal(`<div class="modal-body">${modalHeader("EQUIPMENT CARE",`${Number(id)+1}號廳保養`)}${maintenanceForm(state,b(),Number(id))}</div>`);return;
    case "cancel-maintenance":
      result(E.cancelMaintenance(state,b().id,Number(id)),"保養預約已取消，預付費已退還。");return;
    case "upgrade":
      result(
        E.upgrade(state, b().id, target.dataset.key),
        "區域升級完成，效果今日開始。",
      );
      return;
    case "buy-property":
      confirmInvestment("property");
      return;
    case "open-branch":
      confirmInvestment("branch");
      return;
    case "commit-property":
      if (
        result(E.buyProperty(state, b().id), "恭喜！呢間戲院物業已經屬於你。")
      )
        closeModal();
      return;
    case "commit-branch":
      if (
        result(E.openBranch(state), "第二間分店開業！先親自排片，再開始營業。")
      ) {
        closeModal();
        selectedZone=null;selectedBlock=null;savedCamera=null;mapBranch=null;view = "overview";
        render();
      }
      return;
    case "loan":
      openModal(
        `<div class="modal-body">${modalHeader("CASH FLOW SUPPORT", "申請周轉貸款？")}<p>取得 $20,000 現金，總還款 $22,000。每個營業日有現金時償還 $200，未還清前不能再申請。</p><div class="modal-actions"><button class="secondary" data-action="close">取消</button><button class="primary" data-action="commit-loan">確認申請</button></div></div>`,
      );
      return;
    case "commit-loan":
      if (result(E.emergencyLoan(state), "貸款已入公司帳戶。")) closeModal();
      return;
    case "resolve":
      finishEvent(target.dataset.choice);
      return;
    case "play-mini":
      startMini();
      return;
    case "mini-staff":
      mini = null;
      finishEvent("staff");
      return;
    case "mini-complete":
      if (mini) finishEvent("manual", mini.score);
      return;
    case "ticket-pick":
      if (mini && !mini.done)
        miniAnswer(mini.options[Number(id)] === mini.request);
      return;
    case "snack-pick":
      if (mini && !mini.done) {
        if (Number(id) === mini.request[mini.picks.length]) {
          mini.picks.push(Number(id));
          $("#mini-feedback").textContent = mini.picks.length + " / 2 件已配好";
          if (mini.picks.length === 2) miniAnswer(true);
        } else {
          mini.errors++;
          mini.picks = [];
          $("#mini-feedback").textContent = "配錯喇，按訂單順序再試。";
        }
      }
      return;
    case "trash":
      if (mini && !mini.done && !mini.cleaned.includes(id)) {
        mini.cleaned.push(id);
        target.remove();
        miniAnswer(true);
      }
      return;
    case "resume-save":
      loadSaved();
      return;
    case "recover-save": showRecovery(); return;
    case "commit-recovery": {
      if(!pendingRecovery)return;
      try{const old=readStored();if(old)localStorage.setItem(STORAGE+'-before-recovery',old);}catch{toast('未能備份現有存檔，恢復未有執行。',true);return;}
      if(loadSaved(pendingRecovery)){pendingRecovery=null;persist(false);}return;
    }
    case "reset-prompt":
      openModal(
        `<div class="modal-body">${modalHeader("NEW BEGINNING", "重新開局？")}<p>會開始一間新戲院。現有本機存檔在你儲存新進度時才會被取代。</p><div class="modal-actions"><button class="secondary" data-action="close">取消</button><button class="primary" data-action="commit-reset">開始新一局</button></div></div>`,
      );
      return;
    case "commit-reset":
      try{const old=readStored();if(old)localStorage.setItem(STORAGE+'-before-reset',old);}catch{toast('未能備份原有存檔，尚未重新開局。',true);return;}
      state = E.createGame({construction:true});selectedZone=null;selectedBlock=null;savedCamera=null;mapBranch=null;
      saveReady=true;lastLoadError='';pendingRecovery=null;
      view = "overview";
      mini = null;
      closeModal();
      render();
      toast("新一間戲院，等你開場。");
      return;
  }
}
function loadSaved(raw=readStored()) {
  try {
    if (!raw) {
      toast("未有本機存檔。", true);
      return false;
    }
    const legacy=JSON.parse(raw)?.state?.branches?.some(b=>!b.map);
    const loaded=E.loadGame(raw);
    if(legacy)try{if(!localStorage.getItem(STORAGE+"-before-map-v1"))localStorage.setItem(STORAGE+"-before-map-v1",raw);}catch{}
    if(JSON.parse(raw).state.branches.some(b=>!b.strategy||b.flow&&!b.flow.strategyVersion))try{if(!localStorage.getItem(STORAGE+'-before-strategy-v1'))localStorage.setItem(STORAGE+'-before-strategy-v1',raw)}catch{}
    if(loaded.branches.every(b=>!b.flow))try{if(!localStorage.getItem(STORAGE+'-before-flow-v1'))localStorage.setItem(STORAGE+'-before-flow-v1',raw)}catch{}
    state=loaded;saveReady=true;lastLoadError='';selectedZone=null;selectedBlock=null;savedCamera=null;mapBranch=null;
    mini = null;
    view = "overview";
    closeModal();
    render();
    if (state.phase === "event") showEvent();
    toast(
      state.phase === "running"
        ? "已讀取進度，按「繼續」恢復營業。"
        : "已讀取本機進度。",
    );
    return true;
  } catch (error) {
    saveReady=false;lastLoadError=error.message;
    if(state.phase==='running')state.paused=true;
    updateHeader();
    toast("未能讀取：" + error.message, true);
    return false;
  }
}
function mainAction() {
  if (state.phase === "planning") {
    if(!state.branches.some(C.operational)){selectedZone=null;selectedBlock=null;navigate("investment","build");return;}
    try{if(!localStorage.getItem(STORAGE+'-before-flow-v1'))localStorage.setItem(STORAGE+'-before-flow-v1',E.saveGame(state))}catch{}
    const error = E.startDay(state);
    if (error) {
      toast(error, true);
      view = "schedule";
      render();
      return;
    }
    view = "overview";
    persist();
    render();
    audio.play("open");
    toast(`第 ${state.day} 日開場！${state.branches.filter(C.operational).length} 間戲院同步營業。`);
  } else if (state.phase === "closed") {
    E.nextDay(state);
    persist();
    view = "overview";
    render();
    toast("新一日，先檢查片單同營運安排。");
  } else if (state.phase === "event") showEvent();
}
$("#main-action").onclick = mainAction;
$("#pause-button").onclick = () => {
  state.paused = !state.paused;
  updateHeader();
  persist();
};
$("#save-button").onclick = () => {$("#utilities").hidden=true;$("#more-button").setAttribute("aria-expanded","false");persist(false)};
$("#load-button").onclick = () => {$("#utilities").hidden=true;$("#more-button").setAttribute("aria-expanded","false");loadSaved()};
$("#help-button").onclick = () => help();
$("#sound-button").onclick=()=>{const enabled=audio.toggle();$("#sound-button").textContent=enabled?"音效：開":"音效：關";$("#sound-button").setAttribute("aria-pressed",String(enabled));$("#sound-button").title=enabled?"關閉音效":"開啟音效";};
$("#sound-button").setAttribute("aria-pressed",String(audio.enabled));
$("#sound-button").textContent=audio.enabled?"音效：開":"音效：關";
$("#second-branch").onclick = () => {
  view = "investment";
  render();
};
document.addEventListener('click',e=>{const n=e.target.closest('[data-view]');if(n&&!n.disabled){reportIndex=0;navigate(n.dataset.view,n.dataset.section)}});
$('#cycle-speed').onclick=()=>{state.speed=({1:2,2:4,4:1})[state.speed];updateHeader();persist()};
$('#more-button').onclick=()=>{const menu=$('#utilities');menu.hidden=!menu.hidden;$('#more-button').setAttribute('aria-expanded',String(!menu.hidden))};
$('#branch-picker').onclick=()=>openModal(`<div class="modal-body">${modalHeader('戲院','管理戲院')}<div class="branch-menu">${state.branches.map(v=>`<button class="secondary" data-action="branch" data-id="${v.id}">${esc(v.name)}${v.id===state.activeBranch?' · 管理中':''}</button>`).join('')}<button class="secondary" data-action="navigate" data-target="investment">${state.branches.length<2?'開設第二分店':'查看投資'}</button></div></div>`);
$('#fullscreen-button').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else $('.app-shell').requestFullscreen?.().catch(()=>toast('此瀏覽器未能開啟全螢幕。'))};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#utilities,#more-button')){$('#utilities').hidden=true;$('#more-button').setAttribute('aria-expanded','false')}});
for (const n of document.querySelectorAll("[data-speed]"))
  n.onclick = () => {
    state.speed = Number(n.dataset.speed);
    updateHeader();
    persist();
  };
$("#modal").addEventListener("cancel", (e) => {
  if (state.phase === "event") e.preventDefault();
});
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (t && !t.disabled) {
    try {
      audio.play();
      action(t.dataset.action, t);
    } catch (error) {
      toast("未能完成操作：" + error.message, true);
      console.error(error);
    }
  }
});
document.addEventListener("submit", (e) => {
  if(e.target.id==='maintenance-form'){
    e.preventDefault();const f=new FormData(e.target),[hour,minute]=String(f.get('time')).split(':').map(Number);
    const error=E.bookMaintenance(state,b().id,Number(e.target.dataset.hall),f.get('kind'),hour*60+minute-E.OPEN_MINUTE);
    if(error){$('#maintenance-error').textContent=error;return;}closeModal();persist();render();toast('保養已預約，費用已預付。');return;
  }
  if (e.target.id !== "programme-form") return;
  e.preventDefault();
  const f = new FormData(e.target),
    id = e.target.dataset.id;
  const [hour, minute] = f.get("time").split(":").map(Number);
  const p = {
    id: id || "s" + state.nextId++,
    hall: Number(f.get("hall")),
    start: hour * 60 + minute - E.OPEN_MINUTE,
    movie: f.get("movie"),
    price: Number(f.get("price")),
    format: "2D",
  };
  const programme = b().programme.filter((p) => p.id !== id);
  programme.push(p);
  const error = E.setProgramme(state, b().id, programme);
  if (error) {
    $("#form-error").innerHTML = `<p class="form-error">${esc(error)}</p>`;
    return;
  }
  closeModal();
  persist();
  render();
  toast("排片已更新。");
});
document.addEventListener("change", (e) => {
  if (e.target.matches("[data-role-staff]")) {
    if (!planning()) return;
    const p = b().staff.find(
      (p) => p.id === Number(e.target.dataset.roleStaff),
    );
    if (p && Object.keys(E.ROLES).includes(e.target.value)) {
      p.role = e.target.value;
      persist();
      render();
    }
  }
  if (e.target.matches("[data-food-price]")) {
    if (!planning()) return;
    const i = Number(e.target.dataset.foodPrice),
      price = Number(e.target.value);
    if (!Number.isFinite(price) || price < E.FOODS[i].cost + 1 || price > 150) {
      toast("售價需高於成本，並不超過 $150。", true);
      render();
      return;
    }
    b().foods[i] = Math.round(price);
    persist();
    render();
  }
  if (e.target.id === "report-day") {
    reportIndex = Number(e.target.value);
    render();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.phase === "running") {
    state.paused = true;
    updateHeader();
    persist();
  }
});
window.addEventListener("pagehide", () => persist());
$("#view-content").innerHTML = '<div class="loading">戲院準備中…</div>';
try {
  const loaded=await loadCinemaAssets();atlas=loaded.manifest;images=loaded.images;setPosterAssets(images,atlas);
} catch(error) {
  $('#view-content').innerHTML='<section class="panel load-failure"><h2>戲院素材未能載入</h2><p>請檢查連線，再重新載入。已儲存的進度會保留。</p><button class="primary" onclick="location.reload()">重新載入</button></section>';
  $('#main-action').disabled=true;console.error(error);throw error;
}
if(readStored())loadSaved();else saveReady=true;
render();
help(true);
let previous = performance.now(),
  liveTimer = 0;
function frame(now) {
  const delta = Math.min(0.25, (now - previous) / 1000);
  previous = now;
  if (!document.hidden) {
    if (mini && !mini.done) {
      mini.remaining = Math.max(0, mini.remaining - delta);
      if ($("#mini-timer"))
        $("#mini-timer").textContent = Math.ceil(mini.remaining) + " 秒";
      if ($("#mini-progress"))
        $("#mini-progress").style.width = (mini.remaining / 20) * 100 + "%";
      if (mini.remaining <= 0) endMini();
    }
    E.advance(state, delta * state.speed);
    if (state.phase !== renderedPhase) {
      persist();
      render();
      if (state.phase === "event") {audio.play("event");showEvent();}
      if (state.phase === "closed") {
        audio.play("close");
        toast(
          `第 ${state.day} 日營業結束，營運${state.history[0].net >= 0 ? "盈利" : "虧損"} ${money(Math.abs(state.history[0].net))}。`,
        );
      }
    }
    if (renderer) renderer.render(state, delta);
    liveTimer += delta;
    saveTimer += delta;
    if (liveTimer > 0.5) {
      liveTimer = 0;
      liveUpdate();
    }
    if (saveTimer > 8) {
      saveTimer = 0;
      if (state.phase === "running") persist();
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Read-only diagnostics for repeatable browser QA. No game-state mutation API.
window.__lumen=Object.freeze({getState:()=>JSON.parse(E.saveGame(state)).state,getDiagnostics:()=>renderer?renderer.getDiagnostics():null});
