// Pure, deterministic management simulation. DOM, audio and storage stay outside.
import * as C from './construction.mjs';
import * as Flow from './operations.mjs';
export const DAY_SECONDS = 180;
export const OPEN_MINUTE = 660;
export const DAY_MINUTES = 780;
export const CLEAN_MINUTES = 15;
export const PROPERTY_PRICE = [72000, 98000];
export const BRANCH_PRICE = 54000;
export const ROLES = { tickets: "售票", snacks: "小食", cleaning: "清潔" };
export const FOODS = [
  { id: "popcorn", name: "焦糖爆谷", cost: 8, price: 32, color: "#e6b356" },
  { id: "soda", name: "凍汽水", cost: 5, price: 24, color: "#429ba2" },
  { id: "hotdog", name: "芝士熱狗", cost: 14, price: 42, color: "#b96c4f" },
];
export const MOVIES = [
  [
    "m0",
    "無間打工道",
    "crime",
    "懸疑犯罪",
    118,
    0.48,
    1.16,
    8.5,
    1,
    "東方工業影業",
    "#713e4b",
    "#d99c65",
    "一份臥底工作，兩張強積金帳戶。",
  ],
  [
    "m1",
    "星際搬運工",
    "scifi",
    "科幻大片",
    132,
    0.68,
    1.65,
    8.1,
    1,
    "星河搬運電影",
    "#2e5366",
    "#eab476",
    "穿越銀河，只為準時送達。",
  ],
  [
    "m2",
    "飯氣攻心",
    "comedy",
    "都市喜劇",
    104,
    0.42,
    1.05,
    7.8,
    1,
    "開飯娛樂",
    "#a95b45",
    "#f2c98b",
    "一家人，一張枱，三個外賣平台。",
  ],
  [
    "m3",
    "玩具返工總動員",
    "animation",
    "合家歡動畫",
    96,
    0.5,
    1.22,
    8.3,
    1,
    "皮箱動畫室",
    "#448d91",
    "#efd390",
    "玩具長大後，也要學識打卡。",
  ],
  [
    "m4",
    "午夜尾班車",
    "horror",
    "驚慄恐怖",
    102,
    0.45,
    1.08,
    7.4,
    1,
    "夜更製作",
    "#45474d",
    "#b9aa86",
    "錯過最後一班，就唔止遲到。",
  ],
  [
    "m5",
    "花樣打卡",
    "romance",
    "愛情文藝",
    110,
    0.38,
    0.9,
    8.7,
    1,
    "春光映畫",
    "#77384c",
    "#dba474",
    "在最趕嘅城市，遇上最慢嘅人。",
  ],
  [
    "m6",
    "功夫外賣",
    "action",
    "動作喜劇",
    105,
    0.52,
    1.18,
    8.0,
    1,
    "拳力電影公司",
    "#b07435",
    "#f1d6a0",
    "天下武功，唯準時不破。",
  ],
  [
    "m7",
    "我們的戲院",
    "art",
    "紀錄文藝",
    90,
    0.3,
    0.78,
    9.1,
    1,
    "留白電影社",
    "#5d796d",
    "#ead9b9",
    "關於一間戲院，與留下來的人。",
  ],
  [
    "m8",
    "末日加班戰",
    "scifi",
    "超級大片",
    126,
    0.72,
    1.95,
    8.4,
    8,
    "宇宙輪班影業",
    "#353a69",
    "#f3a767",
    "全城期待！最後一個下班的人拯救世界。",
  ],
  [
    "m9",
    "留低一張票",
    "art",
    "口碑劇情",
    98,
    0.35,
    0.95,
    9.0,
    8,
    "留白電影社",
    "#526d7c",
    "#edc8ae",
    "一張未撕開嘅戲票，一段未完嘅故事。",
  ],
  [
    "m10",
    "新紮打工妹",
    "comedy",
    "港式喜劇",
    101,
    0.43,
    1.15,
    8.0,
    15,
    "開飯娛樂",
    "#bb765c",
    "#f4d39c",
    "由試用期到人生主角。",
  ],
  [
    "m11",
    "怪獸放暑假",
    "animation",
    "合家歡動畫",
    94,
    0.5,
    1.25,
    8.2,
    15,
    "皮箱動畫室",
    "#65865c",
    "#e9c56b",
    "今個暑假，城市有新同學。",
  ],
  [
    "m12",
    "黑夜追單",
    "action",
    "動作懸疑",
    117,
    0.55,
    1.3,
    8.2,
    22,
    "拳力電影公司",
    "#3a606a",
    "#f1bc61",
    "最後一單外賣，通往另一個世界。",
  ],
  [
    "m13",
    "一秒鐘的海",
    "romance",
    "愛情文藝",
    109,
    0.37,
    1.02,
    8.8,
    22,
    "春光映畫",
    "#708f98",
    "#efc2a3",
    "在海邊，把趕路的心留一留。",
  ],
  [
    "m14",
    "星球搬屋日",
    "scifi",
    "超級大片",
    130,
    0.7,
    1.85,
    8.1,
    29,
    "星河搬運電影",
    "#51406d",
    "#db9f7c",
    "銀河最快嘅搬屋隊，再次出發。",
  ],
  [
    "m15",
    "樓上沒有貓",
    "horror",
    "驚慄恐怖",
    97,
    0.44,
    1.15,
    7.9,
    29,
    "夜更製作",
    "#656252",
    "#d7b2a2",
    "每晚十二點，天花板傳來同一個聲音。",
  ],
  [
    "m16",
    "最後一間書店",
    "art",
    "紀錄文藝",
    92,
    0.32,
    0.9,
    9.2,
    36,
    "留白電影社",
    "#7c654a",
    "#e5d6b3",
    "慢慢翻頁，城市還未散場。",
  ],
  [
    "m17",
    "街坊小英雄",
    "animation",
    "合家歡動畫",
    99,
    0.49,
    1.18,
    8.4,
    36,
    "皮箱動畫室",
    "#aa8054",
    "#e7d5a7",
    "拯救世界前，先幫阿媽買餸。",
  ],
  [
    "m18",
    "火線準時到",
    "action",
    "動作大片",
    120,
    0.6,
    1.5,
    8.0,
    43,
    "拳力電影公司",
    "#8e5140",
    "#eac685",
    "最後一分鐘，最後一個承諾。",
  ],
  [
    "m19",
    "戀愛排隊中",
    "romance",
    "都市愛情",
    103,
    0.41,
    1.1,
    8.2,
    43,
    "春光映畫",
    "#a36878",
    "#edceb0",
    "總有一個人，值得等下一場。",
  ],
].map(
  ([
    id,
    title,
    genre,
    type,
    length,
    share,
    heat,
    rating,
    release,
    studio,
    color,
    accent,
    tagline,
  ]) => ({
    id,
    title,
    genre,
    type,
    length,
    share,
    heat,
    rating,
    release,
    studio,
    color,
    accent,
    tagline,
  }),
);
export const COHORTS = [
  {
    id: "students",
    name: "學生客",
    base: 95,
    budget: 75,
    snack: 0.46,
    patience: 0.8,
    colors: ["#e7c36b", "#253b5b"],
    pref: {
      horror: 1.5,
      comedy: 1.4,
      action: 1.3,
      scifi: 1.15,
      animation: 0.8,
      romance: 0.9,
      crime: 0.8,
      art: 0.4,
    },
  },
  {
    id: "workers",
    name: "放工客",
    base: 105,
    budget: 98,
    snack: 0.48,
    patience: 0.6,
    colors: ["#b3b8bd", "#394259"],
    pref: {
      action: 1.4,
      comedy: 1.35,
      crime: 1.3,
      scifi: 1.2,
      romance: 0.8,
      horror: 0.7,
      art: 0.8,
      animation: 0.5,
    },
  },
  {
    id: "couples",
    name: "約會客",
    base: 75,
    budget: 110,
    snack: 0.68,
    patience: 0.85,
    colors: ["#c3818b", "#513d58"],
    pref: {
      romance: 1.65,
      comedy: 1.3,
      horror: 1.1,
      crime: 0.9,
      scifi: 0.9,
      animation: 0.7,
      art: 1,
      action: 0.8,
    },
  },
  {
    id: "families",
    name: "家庭客",
    base: 85,
    budget: 88,
    snack: 0.78,
    patience: 0.7,
    colors: ["#76a39a", "#535968"],
    pref: {
      animation: 2.2,
      comedy: 1.1,
      action: 0.6,
      scifi: 0.7,
      romance: 0.4,
      crime: 0.25,
      horror: 0.08,
      art: 0.4,
    },
  },
  {
    id: "cinephiles",
    name: "深度影迷",
    base: 60,
    budget: 105,
    snack: 0.28,
    patience: 1.2,
    colors: ["#ad9271", "#4c514e"],
    pref: {
      art: 2,
      romance: 1.2,
      crime: 1.3,
      scifi: 1.1,
      horror: 0.8,
      comedy: 0.7,
      action: 0.7,
      animation: 0.9,
    },
  },
  {
    id: "av",
    name: "視聽迷",
    base: 60,
    budget: 128,
    snack: 0.46,
    patience: 0.9,
    colors: ["#7496af", "#39485a"],
    pref: {
      scifi: 2,
      action: 1.75,
      crime: 1,
      animation: 1.1,
      horror: 0.7,
      romance: 0.5,
      art: 0.6,
      comedy: 0.65,
    },
  },
];
export const UPGRADES = {
  decor: {
    name: "大堂裝修",
    cost: 6500,
    description: "改善牆身、導視與綠化，提升觀影吸引力。",
    max: 3,
  },
  sound: {
    name: "影廳音響",
    cost: 9500,
    description: "改善音效，特別吸引視聽迷。",
    max: 3,
  },
  counter: {
    name: "小食服務區",
    cost: 5500,
    description: "增加服務設備，提升小食出餐能力。",
    max: 3,
  },
  seats: {
    name: "擴充影廳",
    cost: 8000,
    description: "每個影廳增設一列階梯座位，共增加 8 席。",
    max: 3,
  },
};
const NAMES = [
  "嘉欣",
  "俊朗",
  "美琪",
  "家豪",
  "詠詩",
  "志明",
  "凱晴",
  "樂軒",
  "慧敏",
  "浩然",
  "雅晴",
  "子軒",
];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const movie = (id) => MOVIES.find((m) => m.id === id);
export const availableMovies = (s) =>
  MOVIES.filter((m) => m.release <= s.day && !isBanned(s, m.id));
export const isBanned = (s, id) => (s.bans[id] || 0) >= s.day;
export function heat(m, day) {
  const age = Math.max(0, day - m.release);
  return Math.max(
    m.rating >= 8.7 ? 0.48 : 0.18,
    m.heat * Math.exp(-age * (m.rating >= 8.7 ? 0.022 : 0.08)),
  );
}
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const emptyLedger = () => ({
  gross: 0,
  share: 0,
  foodRevenue: 0,
  foodCost: 0,
  wages: 0,
  rent: 0,
  maintenance: 0,
  eventCost: 0,
  loanPayment: 0,
  admissions: 0,
  ticketsSold: 0,
  snackLost: 0,
  demand: 0,
  lost: 0,
  snackUnits: [0, 0, 0],
  groups: [0, 0, 0, 0, 0, 0],
  delay: 0,
});
export const net = (l) =>
  l.gross -
  l.share +
  l.foodRevenue -
  l.foodCost -
  l.wages -
  l.rent -
  l.maintenance -
  l.eventCost;
export function branch(id) {
  return {
    id,
    name: id ? "觀塘 · 光影東岸" : "旺角 · 光影戲院",
    district: id ? "觀塘" : "旺角",
    owned: false,
    rent: id ? 1550 : 1100,
    seats: [48, 40],
    upgrades: { decor: 0, sound: 0, counter: 0, seats: 0 },
    foods: FOODS.map((f) => f.price),
    foodUnlocked: [true, true, false],
    reputation: 70,
    staff: [
      {
        id: 1,
        name: id ? "詠詩" : "嘉欣",
        role: "tickets",
        skill: 3,
        wage: 330,
        special: "tickets",
      },
      {
        id: 2,
        name: id ? "志明" : "俊朗",
        role: "tickets",
        skill: 2,
        wage: 260,
        special: "tickets",
      },
      {
        id: 3,
        name: id ? "凱晴" : "美琪",
        role: "snacks",
        skill: 3,
        wage: 330,
        special: "snacks",
      },
      {
        id: 4,
        name: id ? "樂軒" : "家豪",
        role: "cleaning",
        skill: 3,
        wage: 300,
        special: "cleaning",
      },
    ],
    programme: [],
    ledger: emptyLedger(),
    shows: [],
    service: [],
    roomReady: [0, 0],
    closedUntil: [0, 0],
    buffs: { tickets: 0, snacks: 0, cleaning: 0, until: 0 },
    celebrity: null,
  };
}
export function createGame({construction=false}={}) {
  const s = {
    version: 2,
    day: 1,
    cash: 68000,
    phase: "planning",
    elapsed: 0,
    minute: -1,
    speed: 1,
    paused: false,
    activeBranch: 0,
    branches: [branch(0)],
    bans: {},
    events: [],
    pending: null,
    history: [],
    news: [],
    investment: 0,
    dayOpeningCash: 68000,
    loan: 0,
    loanDrawn: 0,
    seed: 20261111,
    nextId: 100,
  };
  if(construction)s.branches[0].map=C.newMap();
  s.branches[0].programme = suggestProgramme(s, 0);
  addNews(s, construction?'由右下角一塊地板開始。按施工指引逐格鋪地，建好基本設施及影廳後開業。':"歡迎開業！先檢查排片、票價同員工，再開始第一日營業。");
  return s;
}
export function addNews(s, text) {
  s.news.unshift({ day: s.day, minute: Math.max(0, s.minute), text });
  s.news = s.news.slice(0, 40);
}
export function suggestProgramme(s, branchId) {
  const b = s.branches.find((x) => x.id === branchId);
  if (!b) return [];
  const pool = availableMovies(s);
  const starts = [
    [15, 195, 390, 570],
    [60, 255, 435, 620],
  ];
  const out = [];
  for (let hall = 0; hall < 2; hall++)
    for (let j = 0; j < 4; j++) {
      if(!C.hasRoom(b,`hall${hall+1}`))continue;
      const m = pool[(j * 2 + hall + (s.day >= 8 ? 2 : 0)) % pool.length];
      if (!m) continue;
      out.push({
        id: `s${s.nextId++}`,
        hall,
        start: starts[hall][j],
        movie: m.id,
        price: (j < 1 ? 78 : j > 1 ? 98 : 88) + (b.id ? 4 : 0),
        format: "2D",
      });
    }
  return out;
}
export function validateProgramme(s, programme) {
  const errors = [];
  if (!Array.isArray(programme) || programme.length > 30 || programme.some(p=>!p||typeof p.id!=='string'||!p.id||p.id.length>100) || new Set(programme.map(p=>p.id)).size!==programme.length)
    return ["場次資料無效"];
  for (const p of programme) {
    const m = movie(p.movie);
    if (!m || m.release > s.day || isBanned(s, p.movie)) {
      errors.push("有未上映或已停映電影");
      continue;
    }
    if (
      ![0, 1].includes(p.hall) ||
      !Number.isInteger(p.start) ||
      p.start < 0 ||
      p.start + m.length > DAY_MINUTES
    )
      errors.push("場次必須在 11:00–24:00 營業時間內");
    if (!Number.isFinite(p.price) || p.price < 20 || p.price > 300)
      errors.push("票價需為 $20–$300");
    if (p.format !== "2D") errors.push("首版只開放普通 2D 格式");
  }
  for (const hall of [0, 1]) {
    const shows = programme
      .filter((p) => p.hall === hall && movie(p.movie))
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < shows.length; i++)
      if (
        shows[i].start <
        shows[i - 1].start + movie(shows[i - 1].movie).length + CLEAN_MINUTES
      )
        errors.push(`${hall + 1} 號影廳場次重疊，或未留 15 分鐘清潔`);
  }
  return [...new Set(errors)];
}
export function setProgramme(s, id, programme) {
  if (s.phase !== "planning") return "營業前先可以更改日常排片";
  const b = s.branches.find((x) => x.id === id);
  if (!b) return "找不到分店";
  const errors = validateProgramme(s, programme);
  if(Array.isArray(programme)&&programme.some(p=>p&&!C.hasRoom(b,`hall${p.hall+1}`)))errors.push('未建成的影廳不能排片');
  if (errors.length) return errors.join("；");
  b.programme = structuredClone(programme);
  return null;
}
function timeWeight(group, start, day) {
  const hour = (OPEN_MINUTE + start) / 60;
  const weekend = day % 7 === 6 || day % 7 === 0;
  if (group === "students") return hour >= 16 ? 1.25 : weekend ? 1.2 : 0.55;
  if (group === "workers") return hour >= 18 ? 1.6 : weekend ? 1 : 0.45;
  if (group === "couples") return hour >= 17 ? 1.3 : 0.75;
  if (group === "families") return hour < 19 ? (weekend ? 1.6 : 1) : 0.35;
  return 1;
}
export function buildDemand(s, b) {
  const random = rng(s.seed + s.day * 1777 + b.id * 331);
  b.walkIns = [0, 0, 0, 0, 0, 0];
  // The same timetable must give the same demand regardless of editor array order.
  const result = [...b.programme].sort((a,b)=>a.start-b.start||a.hall-b.hall||a.id.localeCompare(b.id)).map((p) => ({
    ...p,
    groups: [0, 0, 0, 0, 0, 0],
    demand: 0,
    served: 0,
    booked: false,
    cancelled: false,
    food: [0, 0, 0],
    delay: 0,
    boost: 1,
  }));
  for (let g = 0; g < COHORTS.length; g++) {
    const c = COHORTS[g];
    const location = b.id
      ? g === 1
        ? 1.3
        : g === 4
          ? 0.7
          : 1
      : g === 0
        ? 1.2
        : 1;
    const count = Math.round(
      c.base *
        location *
        (s.day % 7 === 6 || s.day % 7 === 0 ? 1.25 : 1) *
        (b.reputation / 100 + 0.35),
    );
    const weights = result.map((p) => {
      const m = movie(p.movie);
      const price = Math.exp(-(p.price - c.budget) / 55);
      const quality =
        1 +
        b.upgrades.decor * 0.08 +
        (g === 5 ? b.upgrades.sound * 0.25 : b.upgrades.sound * 0.025);
      return (
        (c.pref[m.genre] || 0.5) *
        heat(m, s.day) *
        timeWeight(c.id, p.start, s.day) *
        clamp(price, 0.02, 2) *
        quality *
        0.55
      );
    });
    const total = weights.reduce((a, b) => a + b, 0) + 3.3;
    for (let n = 0; n < count; n++) {
      let r = random() * total,
        selected = false;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          result[i].groups[g]++;
          result[i].demand++;
          selected = true;
          break;
        }
      }
      if (!selected) b.walkIns[g]++;
    }
  }
  return result;
}
export const roleSkill = (b, role) =>
  b.staff
    .filter((p) => p.role === role)
    .reduce((n, p) => n + p.skill * (p.special === role ? 1 : 0.78), 0);
const FLOW_CONTEXT={movie,roleSkill,FOODS,COHORTS,isBanned};
export const operationsSnapshot=(s,id)=>{const b=s.branches.find(b=>b.id===id);return b?Flow.snapshot(s,b,FLOW_CONTEXT):null};
function makeEvents(s, b) {
  const random = rng(s.seed + s.day * 49 + b.id * 93);
  const count =
    s.day === 1 ? 1 : s.day % 7 === 0 ? 0 : Math.floor(random() * 3);
  const types = [
    "snacks",
    "repair",
    "withdrawal",
    "thanks",
    "tickets",
    "cleaning",
  ];
  const events = [];
  for (let i = 0; i < count; i++) {
    let kind = types[(s.day - 1 + b.id + i * 2) % types.length];
    let at = 130 + i * 330 + Math.floor(random() * 45);
    const future = b.shows.filter((p) => p.start > at + 35);
    if (!future.length) continue;
    const target = future[Math.floor(random() * future.length)];
    if (kind === "withdrawal" && isBanned(s, target.movie)) kind = "tickets";
    events.push({
      id: `e${s.day}-${b.id}-${i}`,
      branch: b.id,
      kind,
      at,
      done: false,
      movie: target.movie,
      hall: target.hall,
    });
  }
  return events;
}
export function startDay(s) {
  if (s.phase !== "planning") return "目前不能開始營業";
  if(!s.branches.some(b=>C.operational(b)))return C.preparationError(s.branches.find(b=>b.id===s.activeBranch)||s.branches[0]);
  for (const b of s.branches) {
    if(!C.operational(b))continue;
    if (!b.programme.length) return `${b.name} 尚未排片`;
    if(b.programme.some(p=>!C.hasRoom(b,`hall${p.hall+1}`)))return '未建成的影廳不能排片';
    const e = validateProgramme(s, b.programme);
    if (e.length) return `${b.name}：${e.join("；")}`;
  }
  s.elapsed = 0;
  s.minute = -1;
  s.events = [];
  s.pending = null;
  s.paused = false;
  for (const b of s.branches) {
    b.ledger = emptyLedger();
    if(!C.operational(b)){b.shows=[];b.service=[];delete b.flow;continue;}
    b.shows = buildDemand(s, b);
    b.service = [];
    b.roomReady = [0, 0];
    b.closedUntil = [0, 0];
    b.buffs = { tickets: 0, snacks: 0, cleaning: 0, until: 0 };
    b.celebrity = null;
    Flow.prepare(s,b);
    s.events.push(...makeEvents(s, b));
  }
  s.events.sort((a, b) => a.at - b.at || a.branch - b.branch);
  s.phase = "running";
  addNews(s, `第 ${s.day} 日開始營業，${s.branches.filter(C.operational).length} 間戲院同步運作。`);
  return null;
}
function book(s, b, p) {
  p.booked = true;
  const m = movie(p.movie);
  if (p.cancelled || isBanned(s, m.id) || b.closedUntil[p.hall] > p.start) {
    p.cancelled = true;
    b.ledger.lost += p.demand;
    b.ledger.demand += p.demand;
    return;
  }
  const random = rng(s.seed + s.day * 913 + b.id * 7 + p.start + p.hall * 13);
  const prior = b.service.filter((x) => x.minute > p.start - 18);
  const buff = s.minute <= b.buffs.until ? b.buffs.tickets : 0;
  const cap = Math.max(
    0,
    Math.floor((10 + roleSkill(b, "tickets") * 9) * (1 + buff)) -
      prior.reduce((n, x) => n + x.tickets, 0),
  );
  p.delay = Math.max(0, b.roomReady[p.hall] - p.start);
  b.ledger.delay += p.delay;
  if (buff > 0) {
    for (let g = 0; g < 6; g++) {
      const extra = Math.min(b.walkIns[g], Math.ceil(p.groups[g] * buff * 0.2));
      b.walkIns[g] -= extra;
      p.groups[g] += extra;
      p.demand += extra;
    }
  }
  const demand = Math.min(b.seats[p.hall], Math.round(p.demand * p.boost));
  const attendance = Math.max(
    0,
    Math.min(demand, cap, Math.floor(demand * Math.exp(-p.delay / 45))),
  );
  p.served = attendance;
  const ticket = attendance * p.price;
  const share = ticket * m.share;
  b.ledger.gross += ticket;
  b.ledger.share += share;
  b.ledger.admissions += attendance;
  b.ledger.demand += Math.round(p.demand * p.boost);
  b.ledger.lost += Math.max(0, Math.round(p.demand * p.boost) - attendance);
  s.cash += ticket - share;
  const groups = p.groups.map((n) =>
    p.demand ? Math.round((n / p.demand) * attendance) : 0,
  );
  let left = attendance;
  for (let g = 0; g < groups.length; g++) {
    groups[g] = Math.min(left, groups[g]);
    left -= groups[g];
  }
  groups[0] += left;
  let potential = 0;
  for (let g = 0; g < groups.length; g++) {
    b.ledger.groups[g] += groups[g];
    for (let n = 0; n < groups[g]; n++)
      if (
        random() <
        COHORTS[g].snack *
          (1 + (s.minute <= b.buffs.until ? b.buffs.snacks * 0.3 : 0))
      )
        potential++;
  }
  const snackBuff = s.minute <= b.buffs.until ? b.buffs.snacks : 0;
  let snackCap = Math.max(
    0,
    Math.floor(
      (5 + roleSkill(b, "snacks") * 7 + b.upgrades.counter * 12) *
        (1 + snackBuff),
    ) - prior.reduce((n, x) => n + x.snacks, 0),
  );
  let bought = 0;
  const weights = FOODS.map((f, i) =>
    b.foodUnlocked[i]
      ? Math.exp(-(b.foods[i] - f.price) / 22) * (i === 2 ? 0.6 : 1)
      : 0,
  );
  const total = weights.reduce((a, b) => a + b, 0) + 0.5;
  for (let n = 0; n < potential && bought < snackCap; n++) {
    let r = random() * total;
    for (let i = 0; i < FOODS.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        p.food[i]++;
        b.ledger.snackUnits[i]++;
        b.ledger.foodRevenue += b.foods[i];
        b.ledger.foodCost += FOODS[i].cost;
        s.cash += b.foods[i] - FOODS[i].cost;
        bought++;
        break;
      }
    }
  }
  b.service.push({ minute: p.start, tickets: attendance, snacks: bought });
  b.service = b.service.filter((x) => x.minute >= s.minute - 30);
  const cleaning =
    roleSkill(b, "cleaning") > 0
      ? Math.max(8, 24 - roleSkill(b, "cleaning") * 3 - b.buffs.cleaning)
      : 120;
  b.roomReady[p.hall] = p.start + m.length + p.delay + cleaning;
}
function raiseEvent(s, e) {
  const b = s.branches.find((x) => x.id === e.branch);
  if (
    e.kind === "withdrawal" &&
    !b.shows.some((p) => !p.booked && !p.cancelled && p.movie === e.movie)
  ) {
    e.done = true;
    return false;
  }
  if (
    e.kind === "thanks" &&
    !b.shows.some((p) => !p.booked && !p.cancelled && p.movie === e.movie)
  ) {
    e.done = true;
    return false;
  }
  if (e.kind === "repair")
    b.closedUntil[e.hall] = Math.min(DAY_MINUTES, e.at + 180);
  if (e.kind === "withdrawal") {
    s.bans[e.movie] = s.day + 2;
    addNews(
      s,
      `片商要求《${movie(e.movie).title}》暫停放映至第 ${s.day + 2} 日。`,
    );
  }
  s.pending = e.id;
  s.phase = "event";
  s.activeBranch = e.branch;
  return true;
}
export function advance(s, seconds) {
  if (
    s.phase !== "running" ||
    s.paused ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  )
    return;
  let remaining = seconds;
  for (let guard = 0; guard < 1000 && s.phase === "running"; guard++) {
    const nextMinute = s.minute + 1;
    const boundary = (nextMinute / DAY_MINUTES) * DAY_SECONDS;
    const needed = Math.max(0, boundary - s.elapsed);
    if (remaining + 1e-9 < needed) {
      s.elapsed += remaining;
      return;
    }
    s.elapsed = boundary;
    remaining -= needed;
    s.minute = nextMinute;
    for (const e of s.events)
      if (!e.done && e.at <= s.minute) {
        if (raiseEvent(s, e)) return;
      }
    for (const b of s.branches)
      if(b.flow)Flow.tick(s,b,FLOW_CONTEXT);
      else for (const p of b.shows)
        if (!p.booked && p.start <= s.minute) book(s, b, p);
    if (s.minute >= DAY_MINUTES) {
      finishDay(s);
      return;
    }
    if (remaining <= 1e-9) return;
  }
}
function spend(s, b, amount) {
  if (s.cash < amount) return false;
  s.cash -= amount;
  b.ledger.eventCost += amount;
  return true;
}
export function currentEvent(s) {
  return s.events.find((e) => e.id === s.pending) || null;
}
export function replacementOptions(s, e) {
  const b = s.branches.find((x) => x.id === e.branch);
  const affected = b.shows.filter(
    (p) => !p.booked && !p.cancelled && p.movie === e.movie,
  );
  return availableMovies(s).filter((m) =>
    affected.every((p) => {
      const next = b.shows
        .filter((q) => q.hall === p.hall && !q.cancelled && q.start > p.start)
        .sort((a, b) => a.start - b.start)[0];
      return (
        p.start + m.length + (next ? CLEAN_MINUTES : 0) <=
        (next ? next.start : DAY_MINUTES)
      );
    }),
  );
}
export function resolveEvent(s, choice, score = 0, replacement = null) {
  const e = currentEvent(s);
  if (s.phase !== "event" || !e) return "沒有待處理事件";
  const b = s.branches.find((x) => x.id === e.branch);
  score = clamp(Number(score) || 0, 0, 1);
  if (["tickets", "snacks", "cleaning"].includes(e.kind)) {
    if (!["staff", "manual"].includes(choice)) return "請選擇處理方式";
    if (choice === "manual") {
      b.buffs[e.kind] = e.kind === "cleaning" ? score * 10 : score * 0.7;
      b.buffs.until = s.minute + 210;
      b.reputation = clamp(b.reputation + score * 2, 25, 100);
      addNews(s, `你親自協助${ROLES[e.kind]}，之後一段時間服務效率提升。`);
    } else {
      if (e.kind === "cleaning") {
        b.roomReady[e.hall] = Math.max(b.roomReady[e.hall], s.minute + 25);
        b.reputation = clamp(b.reputation - 0.5, 25, 100);
      }
      addNews(s, `${b.name}：員工已接手${ROLES[e.kind]}工作。`);
    }
  } else if (e.kind === "repair") {
    const costs = { standard: 800, urgent: 2400, wait: 0 };
    if (!(choice in costs)) return "請選擇維修方式";
    if (!spend(s, b, costs[choice])) return "公司資金不足";
    b.closedUntil[e.hall] =
      choice === "urgent"
        ? s.minute + 45
        : choice === "standard"
          ? s.minute + 180
          : DAY_MINUTES;
    addNews(
      s,
      `${b.name} ${e.hall + 1} 號廳：${choice === "urgent" ? "加急維修，45 分鐘後恢復" : choice === "standard" ? "一般維修，3 小時後恢復" : "暫停至明日，交由例行維護處理"}。`,
    );
  } else if (e.kind === "withdrawal") {
    if (!["replace", "cancel"].includes(choice)) return "請選擇換片或取消";
    if (choice === "replace") {
      const m = replacementOptions(s, e).find((m) => m.id === replacement);
      if (!m) return "替代電影未能配合原有時段";
      if (!spend(s, b, 400)) return "換片協調費需要 $400";
      for (const venue of s.branches)
        for (const p of venue.shows)
          if (!p.booked && !p.cancelled && p.movie === e.movie) {
            const next = venue.shows
              .filter(
                (q) => q.hall === p.hall && !q.cancelled && q.start > p.start,
              )
              .sort((a, b) => a.start - b.start)[0];
            if (
              p.start + m.length + (next ? CLEAN_MINUTES : 0) >
              (next ? next.start : DAY_MINUTES)
            ) {
              p.cancelled = true;
              continue;
            }
            p.movie = m.id;
            p.groups = p.groups.map((n) => Math.floor(n * 0.75));
            p.demand = p.groups.reduce((a, b) => a + b, 0);
            p.boost = 0.9;
          }
      addNews(
        s,
        `未開場場次已改映《${m.title}》，需求可能下降；原片繼續停映。`,
      );
    } else {
      for (const venue of s.branches)
        for (const p of venue.shows)
          if (!p.booked && p.movie === e.movie) p.cancelled = true;
      addNews(s, "停映電影的未開場場次已取消，未售出票不計收入。");
    }
  } else if (e.kind === "thanks") {
    if (!["accept", "decline"].includes(choice)) return "請選擇活動安排";
    if (choice === "accept") {
      if (!spend(s, b, 1200)) return "活動接待費需要 $1,200";
      for (const p of b.shows)
        if (!p.booked && p.movie === e.movie) p.boost = 1.8;
      b.celebrity = e.movie;
      b.reputation = clamp(b.reputation + 2, 25, 100);
      addNews(
        s,
        `《${movie(e.movie).title}》謝票場已安排，指定電影當日需求上升。`,
      );
    } else addNews(s, "已婉拒本次謝票活動，保留原有安排。");
  }
  e.done = true;
  s.pending = null;
  s.phase = "running";
  for(const b of s.branches)Flow.reconcile(s,b,FLOW_CONTEXT);
  return null;
}
function finishDay(s) {
  const rows = [];
  for (const b of s.branches) {
    Flow.close(s,b);
    const l = b.ledger;
    l.wages = C.operational(b)?b.staff.reduce((n, p) => n + p.wage, 0):0;
    l.rent = C.operational(b)&&!b.owned?b.rent:0;
    l.maintenance = C.operational(b)?280 + b.upgrades.sound * 70 + b.upgrades.seats * 45:0;
    s.cash -= l.wages + l.rent + l.maintenance;
    const rate = l.demand ? l.admissions / l.demand : 0;
    if(C.operational(b))b.reputation = clamp(
      b.reputation + (rate > 0.7 ? 0.8 : rate < 0.35 ? -1.2 : 0),
      25,
      100,
    );
    rows.push({
      id: b.id,
      name: b.name,
      owned: b.owned,
      programme: b.shows
        .filter((p) => !p.cancelled)
        .map(({ id, hall, start, movie, price, format }) => ({
          id,
          hall,
          start,
          movie,
          price,
          format,
        })),
      ledger: structuredClone(l),
      net: net(l),
    });
  }
  if (s.loan > 0) {
    const payment = Math.min(200, s.loan, Math.max(0, s.cash));
    s.loan -= payment;
    s.cash -= payment;
    rows[0].ledger.loanPayment = payment;
  }
  const report = {
    day: s.day,
    openingCash: s.dayOpeningCash,
    closingCash: s.cash,
    investment: s.investment,
    financing: s.loanDrawn,
    rows,
    net: rows.reduce((n, r) => n + r.net, 0),
  };
  s.history.unshift(report);
  s.history = s.history.slice(0, 50);
  s.phase = "closed";
  s.elapsed = DAY_SECONDS;
  s.minute = DAY_MINUTES;
  addNews(
    s,
    `第 ${s.day} 日結算：營運${report.net >= 0 ? "盈利" : "虧損"} $${Math.round(Math.abs(report.net)).toLocaleString("en-HK")}。`,
  );
}
export function nextDay(s) {
  if (s.phase !== "closed") return "請先完成當日營業";
  s.day++;
  s.phase = "planning";
  s.elapsed = 0;
  s.minute = -1;
  s.events = [];
  s.pending = null;
  s.investment = 0;
  s.loanDrawn = 0;
  s.dayOpeningCash = s.cash;
  for (const b of s.branches) {
    b.programme = b.shows
      .filter((p) => !p.cancelled)
      .map(({ id, hall, start, movie, price, format }) => ({
        id,
        hall,
        start,
        movie,
        price,
        format,
      }));
    b.shows = [];
    delete b.flow;
    b.ledger = emptyLedger();
    b.closedUntil = [0, 0];
    b.roomReady = [0, 0];
  }
  const releases = MOVIES.filter((m) => m.release === s.day);
  if (releases.length)
    addNews(
      s,
      `新片到埠：${releases.map((m) => "《" + m.title + "》").join("、")}，可自由選擇放映。`,
    );
  return null;
}
export function buyProperty(s, id) {
  if (s.phase !== "planning") return "請在營業前處理物業投資";
  const b = s.branches.find((x) => x.id === id);
  if (!b || b.owned) return "這間戲院已是自置物業";
  const cost = PROPERTY_PRICE[id];
  if (s.cash < cost) return "買斷物業資金不足";
  s.cash -= cost;
  s.investment += cost;
  b.owned = true;
  addNews(s, `${b.name} 物業已買斷！免租，但仍需支付維護費。`);
  return null;
}
export function openBranch(s) {
  if (s.phase !== "planning") return "請在營業前開設分店";
  if (s.branches.length >= 2) return "首版最多管理兩間戲院";
  if (s.cash < BRANCH_PRICE) return "開設第二間戲院需要 $54,000";
  s.cash -= BRANCH_PRICE;
  s.investment += BRANCH_PRICE;
  s.branches.push(branch(1));
  if(s.branches[0].map)s.branches.at(-1).map=C.newMap();
  s.activeBranch = 1;
  addNews(s, s.branches[1].map?'觀塘分店開始籌備。先鋪地及建造基本設施，原店可繼續營業。':"觀塘分店已開業！請親自排片、定價及配置員工，兩店將同步營業。");
  return null;
}
export function upgrade(s, id, key) {
  if (s.phase !== "planning") return "請在營業前進行升級";
  const b = s.branches.find((x) => x.id === id),
    u = UPGRADES[key];
  if (!b || !u) return "無效升級";
  const level = b.upgrades[key];
  if (level >= u.max) return "已達首版最高等級";
  const cost = u.cost * (level + 1);
  if (s.cash < cost) return "升級資金不足";
  s.cash -= cost;
  s.investment += cost;
  b.upgrades[key]++;
  if (key === "seats") b.seats = b.seats.map((n) => n + 8);
  addNews(s, `${b.name}：${u.name}已升至 ${level + 1} 級。`);
  return null;
}
export function hire(s, id) {
  if (s.phase !== "planning") return "請在營業前聘請";
  const b = s.branches.find((x) => x.id === id);
  if (!b || b.staff.length >= 12) return "首版每店最多 12 位員工";
  if (s.cash < 800) return "招聘費需要 $800";
  s.cash -= 800;
  s.investment += 800;
  const n = s.nextId++,
    skill = 2 + (n % 3),
    role = ["tickets", "snacks", "cleaning"][n % 3];
  b.staff.push({
    id: n,
    name: NAMES[n % NAMES.length],
    role,
    skill,
    wage: 180 + skill * 50,
    special: role,
  });
  return null;
}
export function train(s, id, staffId) {
  if (s.phase !== "planning") return "請在營業前安排培訓";
  const p = s.branches
    .find((x) => x.id === id)
    ?.staff.find((x) => x.id === staffId);
  if (!p || p.skill >= 5) return "已達最高能力";
  const cost = 900 * p.skill;
  if (s.cash < cost) return "培訓資金不足";
  s.cash -= cost;
  s.investment += cost;
  p.skill++;
  p.wage += 40;
  return null;
}
export function unlockFood(s, id) {
  if (s.phase !== "planning") return "請在營業前解鎖食品";
  const b = s.branches.find((x) => x.id === id);
  if (b.foodUnlocked[2]) return "熱狗已解鎖";
  if (s.cash < 3500) return "食品設備費需要 $3,500";
  s.cash -= 3500;
  s.investment += 3500;
  b.foodUnlocked[2] = true;
  return null;
}
export function emergencyLoan(s) {
  if (s.phase !== "planning") return "請在營業前申請";
  if (s.loan > 0) return "請先還清現有貸款";
  s.cash += 20000;
  s.loanDrawn += 20000;
  s.loan = 22000;
  addNews(
    s,
    "已取得 $20,000 周轉貸款，總還款 $22,000；有現金時每日償還 $200。",
  );
  return null;
}
export function saveGame(s) {
  return JSON.stringify({
    type: "lumen-cinema-save",
    savedAt: Date.now(),
    state: s,
  });
}
export function loadGame(raw) {
  const data = JSON.parse(raw);
  const s = data?.state;
  if (data.type !== "lumen-cinema-save" || s?.version !== 2)
    throw Error("存檔版本不相容");
  if (
    !Number.isInteger(s.day) ||
    s.day < 1 ||
    s.day > 100000 ||
    !Number.isFinite(s.cash) ||
    Math.abs(s.cash) > 1e12
  )
    throw Error("存檔財務或日期無效");
  if (
    !["planning", "running", "event", "closed"].includes(s.phase) ||
    !Number.isFinite(s.elapsed) ||
    s.elapsed < 0 ||
    s.elapsed > DAY_SECONDS ||
    !Number.isInteger(s.minute) ||
    s.minute < -1 ||
    s.minute > DAY_MINUTES
  )
    throw Error("存檔時間無效");
  if (
    !Array.isArray(s.branches) ||
    s.branches.length < 1 ||
    s.branches.length > 2 ||
    s.branches.some((b, i) => b.id !== i)
  )
    throw Error("分店資料無效");
  if (
    !Array.isArray(s.history) ||
    s.history.length > 50 ||
    !Array.isArray(s.events) ||
    s.events.length > 4 ||
    !Array.isArray(s.news) ||
    s.news.length > 40
  )
    throw Error("紀錄資料無效");
  for (const b of s.branches) {
    if(b.map===undefined)b.map=C.fullMap();else C.validateMap(b.map);
    if (
      !Array.isArray(b.staff) ||
      b.staff.length > 12 ||
      !Array.isArray(b.programme) ||
      b.programme.length > 30 ||
      !Array.isArray(b.shows) ||
      b.shows.length > 30
    )
      throw Error("營運資料無效");
    for (const p of b.programme)
      if (
        !movie(p.movie) ||
        ![0, 1].includes(p.hall) ||
        !Number.isFinite(p.start) ||
        !Number.isFinite(p.price)
      )
        throw Error("排片資料無效");
    for (const p of b.staff)
      if (
        !Object.keys(ROLES).includes(p.role) ||
        !Number.isFinite(p.skill) ||
        p.skill < 1 ||
        p.skill > 5 ||
        !Number.isFinite(p.wage) ||
        p.wage < 0 ||
        typeof p.name !== "string" ||
        p.name.length > 20
      )
        throw Error("員工資料無效");
    if (
      !b.upgrades ||
      Object.keys(UPGRADES).some(
        (k) =>
          !Number.isInteger(b.upgrades[k]) ||
          b.upgrades[k] < 0 ||
          b.upgrades[k] > 3,
      )
    )
      throw Error("升級資料無效");
    for (const arr of [b.seats, b.foods])
      if (
        !Array.isArray(arr) ||
        arr.some((n) => !Number.isFinite(n) || n < 0 || n > 1000)
      )
        throw Error("價格或座位資料無效");
  }
  if (s.phase === "event" && !currentEvent(s)) throw Error("事件資料不完整");
  for(const b of s.branches)Flow.validate(b);
  s.paused = s.phase === "running";
  return s;
}

export function buildFloor(s,id,x,y){
 if(s.phase!=='planning')return '請在營業前安排建造';const b=s.branches.find(b=>b.id===id);if(!b)return '找不到分店';const error=C.floorError(b,x,y);if(error)return error;if(s.cash<C.FLOOR_COST)return '鋪地資金不足';s.cash-=C.FLOOR_COST;s.investment+=C.FLOOR_COST;b.map.floors.push(C.key(x,y));addNews(s,`已鋪第 ${y+1} 行、第 ${x+1} 列地板。`);return null;
}
export function constructRoom(s,id,roomId){
 if(s.phase!=='planning')return '請在營業前安排建造';const b=s.branches.find(b=>b.id===id),r=C.ROOMS.find(r=>r.id===roomId);if(!b||!r||!b.map)return '無效建造區域';if(C.hasRoom(b,roomId))return '這個區域已建好';const error=C.roomError(b,roomId);if(error)return error;if(s.cash<r.cost)return '建造資金不足';s.cash-=r.cost;s.investment+=r.cost;b.map.built.push(roomId);if(roomId.startsWith('hall'))b.programme.push(...suggestProgramme(s,id).filter(p=>p.hall===Number(roomId.slice(-1))-1));addNews(s,`${r.name}建造完成${C.operational(b)?'，基本設施已齊，可以開始營業。':'。'}`);return null;
}

// A dry-run uses exactly the live rules, on private copies, with random events excluded.
export function forecastProgramme(s,id,programme=null){
 const original=s.branches.find(b=>b.id===id);if(!original)return {error:'找不到分店'};
 const plan=programme||original.programme,errors=validateProgramme(s,plan);
 if(errors.length)return {error:errors.join('；')};
 if(!plan.length)return {error:'先加入放映場次，再查看預測'};
 if(!C.operational(original))return {error:'建好基本設施及影廳後，即可預測營運'};
 if(plan.some(p=>!C.hasRoom(original,`hall${p.hall+1}`)))return {error:'未建成的影廳不能排片'};
 const samples=[0,-101,101].map(offset=>{
  const copy=structuredClone(s),b=structuredClone(original);copy.branches=[b];copy.activeBranch=b.id;copy.phase='planning';copy.seed+=offset;b.programme=structuredClone(plan);
  const error=startDay(copy);if(error)throw Error(error);copy.events=[];advance(copy,DAY_SECONDS);
  return {report:copy.history[0],branch:b};
 });
 const {report,branch:b}=samples[0],l=b.ledger,range=samples.map(x=>x.report.net);
 return {error:null,net:report.net,low:Math.min(...range),high:Math.max(...range),gross:l.gross,share:l.share,ticketNet:l.gross-l.share,foodProfit:l.foodRevenue-l.foodCost,admissions:l.admissions,lost:l.lost,snackLost:l.snackLost,wages:l.wages,rent:l.rent,maintenance:l.maintenance,delay:l.delay,peak:{...b.flow.peak},rows:b.shows.map(p=>({id:p.id,hall:p.hall,movie:p.movie,start:p.start,price:p.price,demand:p.flowDemand,served:p.served,sold:p.sold,occupancy:p.served/b.seats[p.hall],gross:p.ticketGross,share:p.ticketShare,ticketNet:p.ticketGross-p.ticketShare,foodProfit:p.foodRevenue-p.foodCost,contribution:p.ticketGross-p.ticketShare+p.foodRevenue-p.foodCost,lost:p.lost,delay:p.delay,groups:p.groups.map((n,g)=>({id:COHORTS[g].id,name:COHORTS[g].name,count:n})).sort((a,b)=>b.count-a.count)})),basis:'依現有人手、價格、設備及今日熱度模擬；不含突發事件、貸款還款及新投資。範圍為三種客流情境，不是保證收入。'};
}
