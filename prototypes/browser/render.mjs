import { movie, COHORTS, DAY_MINUTES } from "./engine.mjs";
export class CinemaRenderer {
  constructor(canvas, atlas, images) {
    this.canvas = canvas;
    this.c = canvas.getContext("2d");
    this.atlas = atlas.assets;
    this.images = images;
    this.animation = 0;
    this.hover = null;
  }
  point(x, y) {
    return [550 + (x - y) * 27, 83 + (x + y) * 13.5];
  }
  poly(points, fill, stroke) {
    const c = this.c;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 0.6;
      c.stroke();
    }
  }
  tile(x, y, fill, stroke = "#f2ebdd22") {
    const [a, b] = this.point(x, y);
    this.poly(
      [
        [a, b],
        [a + 27, b + 13.5],
        [a, b + 27],
        [a - 27, b + 13.5],
      ],
      fill,
      stroke,
    );
  }
  wall(x1, y1, x2, y2, h, color) {
    const [a, b] = this.point(x1, y1),
      [d, e] = this.point(x2, y2);
    this.poly(
      [
        [a, b],
        [d, e],
        [d, e - h],
        [a, b - h],
      ],
      color,
    );
    this.poly(
      [
        [a, b - h],
        [d, e - h],
        [d + 4, e - h - 4],
        [a + 4, b - h - 4],
      ],
      "#70606e",
    );
  }
  prop(id, x, y, scale = 1, offset = 0, tint = null) {
    const a = this.atlas.find((a) => a.id === id);
    if (!a || !this.images[a.file]) return;
    const c = this.c,
      [px, py] = this.point(x, y),
      [sx, sy, sw, sh] = a.region,
      w = a.world_width * scale,
      h = (w * sh) / sw;
    c.imageSmoothingEnabled = false;
    c.save();
    if (tint) c.globalAlpha = tint;
    c.drawImage(
      this.images[a.file],
      sx,
      sy,
      sw,
      sh,
      Math.round(px - w / 2),
      Math.round(py - h - offset),
      Math.round(w),
      Math.round(h),
    );
    c.restore();
  }
  text(text, x, y, size = 12, color = "#dfc393", align = "left") {
    const c = this.c;
    c.font = `${size}px Arial,"Noto Sans CJK TC",sans-serif`;
    c.fillStyle = color;
    c.textAlign = align;
    c.fillText(text, x, y);
    c.textAlign = "left";
  }
  person(x, y, group = 0, staff = false, walking = true) {
    const c = this.c,
      [px, py] = this.point(x, y),
      skin = ["#e2ba95", "#c99e77", "#edc8ab"][group % 3],
      colors = COHORTS[group % 6].colors;
    const t = this.animation * 6 + group * 1.7,
      step = walking ? Math.sin(t) * 2 : 0;
    c.save();
    c.translate(Math.round(px), Math.round(py));
    c.fillStyle = "#251f3233";
    c.fillRect(-6, -1, 12, 4);
    c.fillStyle = staff ? "#3d394e" : colors[1];
    c.fillRect(-4, -9, 3, 8 + step);
    c.fillRect(1, -9, 3, 8 - step);
    c.fillStyle = staff ? "#742b43" : colors[0];
    c.fillRect(-5, -21, 10, 13);
    c.fillStyle = skin;
    c.fillRect(-7, -18, 2, 8);
    c.fillRect(5, -18, 2, 8);
    c.fillStyle = "#e5c09e";
    c.fillRect(-4, -29, 8, 9);
    c.fillStyle = "#362b32";
    c.fillRect(-5, -31, 10, 4);
    c.fillRect(-5, -28, 2, 6);
    if (group % 3 === 0) c.fillRect(3, -28, 2, 5);
    c.fillStyle = "#3b3030";
    c.fillRect(2, -26, 1, 1);
    if (staff) {
      c.fillStyle = "#f1e2ca";
      c.fillRect(-2, -19, 4, 7);
      c.fillStyle = "#bf9854";
      c.fillRect(2, -17, 2, 2);
    }
    c.restore();
  }
  screen(x, y, w, m, active) {
    const c = this.c,
      [a, b] = this.point(x, y),
      [d, e] = this.point(x + w, y);
    this.poly(
      [
        [a, b - 60],
        [d, e - 60],
        [d, e - 23],
        [a, b - 23],
      ],
      "#1e1c2a",
    );
    const col = m ? m.color : "#5e5c71",
      accent = m ? m.accent : "#d1bd98";
    this.poly(
      [
        [a + 4, b - 55],
        [d - 4, e - 55],
        [d - 4, e - 28],
        [a + 4, b - 28],
      ],
      col,
    );
    if (active) {
      c.globalAlpha = 0.1 + Math.sin(this.animation * 2) * 0.035;
      this.poly(
        [
          [a, b - 23],
          [d, e - 23],
          this.point(x + w + 1, y + 4),
          this.point(x - 1, y + 4),
        ],
        accent,
      );
      c.globalAlpha = 1;
    }
    const midx = (a + d) / 2,
      midy = (b + e) / 2;
    c.fillStyle = accent;
    c.beginPath();
    c.arc(midx, midy - 43, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = col;
    c.fillRect(midx + 1, midy - 56, 10, 13);
    this.text(
      active ? "放映中" : "LUMEN",
      midx,
      midy - 12,
      9,
      "#ddceb4",
      "center",
    );
  }
  render(state, delta = 0) {
    const c = this.c,
      b =
        state.branches.find((v) => v.id === state.activeBranch) ||
        state.branches[0];
    if (state.phase === "running" && !state.paused)
      this.animation += delta * state.speed;
    else if (state.phase === "planning") this.animation += delta * 0.25;
    c.clearRect(0, 0, 1120, 760);
    const minute = state.minute < 0 ? 0 : state.minute;
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 19; x++) {
        const hall = y < 10;
        let col = hall
          ? x < 8
            ? (x + y) % 2
              ? "#483241"
              : "#493543"
            : x > 9
              ? (x + y) % 2
                ? "#353444"
                : "#39394a"
              : "#6a5b5f"
          : (x + y) % 2
            ? "#d3c3aa"
            : "#d8cab4";
        if (b.upgrades.decor > 0 && !hall)
          col = (x + y) % 2 ? "#dfcfb7" : "#e4d5bd";
        this.tile(x, y, col, hall ? "#ffffff06" : "#b7a68e45");
      }
    this.wall(0, 0, 19, 0, 65, "#45404e");
    this.wall(0, 0, 0, 20, 65, "#584650");
    this.wall(9, 0, 9, 9.5, 55, "#2e2a39");
    const activeShows = [0, 1].map((h) =>
      b.shows.find(
        (p) =>
          !p.cancelled &&
          p.booked &&
          p.hall === h &&
          minute >= p.start &&
          minute < p.start + movie(p.movie).length + p.delay,
      ),
    );
    this.screen(
      0.8,
      0,
      6.6,
      movie(
        activeShows[0]?.movie || b.programme.find((p) => p.hall === 0)?.movie,
      ),
      !!activeShows[0],
    );
    this.screen(
      10.2,
      0,
      7.6,
      movie(
        activeShows[1]?.movie || b.programme.find((p) => p.hall === 1)?.movie,
      ),
      !!activeShows[1],
    );
    for (let h = 0; h < 2; h++) {
      const x = h ? 13.5 : 4,
        [px, py] = this.point(x, 10);
      this.text(`${h + 1} 號影廳`, px, py - 4, 13, "#e6c993", "center");
      this.text(
        `${b.seats[h]} 席 · ${b.closedUntil[h] > minute ? "維修中" : activeShows[h] ? "放映中" : "準備就緒"}`,
        px,
        py + 13,
        10,
        b.closedUntil[h] > minute ? "#edb2a4" : "#bca99a",
        "center",
      );
    }
    const props = [];
    for (let y = 1; y <= 8; y++)
      for (let x = 1; x <= 6; x++)
        props.push({ depth: x + y, draw: () => this.prop("seat", x, y, 0.92) });
    for (let y = 1; y <= 8; y++)
      for (let x = 11; x <= 15; x++)
        props.push({ depth: x + y, draw: () => this.prop("seat", x, y, 0.92) });
    if (b.upgrades.seats > 0)
      for (let x of [7, 16])
        for (let y = 1; y <= 8; y++)
          props.push({
            depth: x + y,
            draw: () => this.prop("seat", x, y, 0.86),
          });
    const facilities = [
      ["concession_counter", 4, 12.5, 1.05],
      ["ticket_counter", 13, 13, 1],
      ["ticket_kiosk", 16, 14, 1],
      ["ticket_kiosk", 17, 14, 1],
      ["popcorn_machine", 1.5, 12, 1],
      ["soda_dispenser", 2, 14, 1],
      ["plant", 0.5, 16, 1],
      ["recycling_bins", 2, 18, 1],
      ["cleaning_cart", 8, 12.2, 1],
      ["plant", 18, 17.5, 1],
      ["plant", 10, 18, 1],
    ];
    if (b.upgrades.counter) facilities.push(["concession_counter", 4, 15, 1]);
    if (b.upgrades.decor)
      facilities.push(["plant", 7, 17, 1], ["plant", 12, 18, 1]);
    for (const [id, x, y, scale] of facilities)
      props.push({ depth: x + y, draw: () => this.prop(id, x, y, scale) });
    const baseCrowd =
      state.phase === "running" ? 5 : state.phase === "closed" ? 1 : 3;
    const flow = b.shows
      .filter((p) => !p.cancelled)
      .reduce(
        (n, p) =>
          n +
          Math.max(0, 1 - Math.abs(minute - (p.start - 5)) / 55) *
            (p.served || p.demand || 20),
        0,
      );
    const people = Math.min(32, baseCrowd + Math.floor(flow / 4));
    for (let i = 0; i < people; i++) {
      const cycle = (this.animation * 0.075 + i * 0.371) % 1,
        route = i % 3;
      let x, y;
      if (cycle < 0.35) {
        const q = cycle / 0.35;
        x = 10 + (route === 0 ? 3 : route === 1 ? -6 : 6) * q;
        y = 20 - (route === 0 ? 6 : route === 1 ? 6 : 5) * q;
      } else if (cycle < 0.65) {
        const q = (cycle - 0.35) / 0.3;
        x = route === 0 ? 13 : route === 1 ? 4 : 16;
        y = route === 0 ? 14 - q * 2 : route === 1 ? 14 - q * 1.2 : 15 - q;
      } else {
        const q = (cycle - 0.65) / 0.35;
        x = (route === 1 ? 4 : 13) + (i % 2 ? 1 : -1) * q;
        y = 14 - q * 4.5;
      }
      props.push({
        depth: x + y + 0.1,
        draw: () =>
          this.person(
            x,
            y,
            i % 6,
            false,
            state.phase === "running" && !state.paused,
          ),
      });
    }
    const jobs = {
      tickets: [
        [13.1, 11.8],
        [15, 12.2],
        [17, 12],
      ],
      snacks: [
        [3.5, 11.5],
        [5, 11.7],
        [4, 14],
      ],
      cleaning: [
        [8.2, 11.4],
        [8.5, 15],
        [12, 17],
      ],
    };
    for (const role of Object.keys(jobs)) {
      const staff = b.staff.filter((p) => p.role === role);
      staff.slice(0, 3).forEach((person, i) => {
        let [x, y] = jobs[role][i];
        if (role === "cleaning" && state.phase === "running") {
          x += Math.sin(this.animation * 0.25 + i) * 0.7;
          y += Math.cos(this.animation * 0.2 + i) * 0.7;
        }
        props.push({
          depth: x + y,
          draw: () =>
            this.person(
              x,
              y,
              i + 3,
              true,
              role === "cleaning" && state.phase === "running",
            ),
        });
      });
    }
    props.sort((a, b) => a.depth - b.depth).forEach((p) => p.draw());
    const [ex, ey] = this.point(11, 20);
    this.poly(
      [
        [ex - 85, ey - 14],
        [ex + 55, ey + 55],
        [ex + 55, ey + 74],
        [ex - 85, ey + 5],
      ],
      "#702b43",
    );
    this.text(
      b.id ? "LUMEN EAST" : "LUMEN CINEMA",
      ex - 68,
      ey + 12,
      12,
      "#efd8ae",
    );
    const [lx, ly] = this.point(9, 17.8);
    this.text(
      b.upgrades.decor ? "LOUNGE · 休息區" : "LOBBY · 大堂",
      lx,
      ly,
      11,
      "#9c8161",
      "center",
    );
    if (b.upgrades.decor) {
      for (let i = 0; i < 3; i++) {
        const [px, py] = this.point(8 + i, 17);
        this.poly(
          [
            [px - 14, py - 14],
            [px + 13, py - 2],
            [px + 13, py + 8],
            [px - 14, py - 5],
          ],
          "#78384b",
        );
      }
    }
    if (b.upgrades.sound > 0) {
      for (const x of [0.4, 7.5, 10.2, 18.2]) {
        const [px, py] = this.point(x, 0.2);
        c.fillStyle = "#211f2a";
        c.fillRect(px - 5, py - 45, 11, 24);
        c.fillStyle = "#56505d";
        c.fillRect(px - 3, py - 40, 7, 13);
      }
    }
    const [ax, ay] = this.point(0.5, 8);
    this.text("01", ax - 4, ay - 51, 14, "#e0c086");
    const [dx, dy] = this.point(18, 1);
    this.text("02", dx - 10, dy - 45, 14, "#e0c086");
  }
}
export function drawPoster(canvas, m) {
  const c = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  c.fillStyle = m.color;
  c.fillRect(0, 0, w, h);
  c.fillStyle = m.accent;
  c.globalAlpha = 0.18;
  for (let y = 0; y < h; y += 5) c.fillRect(0, y, w, 1);
  c.globalAlpha = 1;
  const motif = {
    scifi: 0,
    crime: 1,
    comedy: 2,
    animation: 3,
    horror: 4,
    romance: 5,
    action: 6,
    art: 7,
  }[m.genre];
  if (motif === 0) {
    c.beginPath();
    c.arc(w * 0.65, h * 0.28, w * 0.23, 0, 7);
    c.fill();
    c.fillStyle = m.color;
    c.beginPath();
    c.arc(w * 0.71, h * 0.24, w * 0.21, 0, 7);
    c.fill();
    c.fillStyle = m.accent;
    for (let i = 0; i < 24; i++)
      c.fillRect((i * 37) % w, (i * 23) % (h * 0.65), 2, 2);
    c.fillStyle = "#101c2b";
    for (let i = 0; i < 9; i++)
      c.fillRect((i * w) / 8, h * 0.54 - (i % 3) * 10, w / 9, h * 0.3);
  } else if ([1, 4].includes(motif)) {
    c.fillStyle = "#171822";
    c.beginPath();
    c.moveTo(0, h * 0.7);
    c.lineTo(w * 0.25, h * 0.3);
    c.lineTo(w * 0.7, h * 0.2);
    c.lineTo(w, h * 0.6);
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.fill();
    c.fillStyle = m.accent;
    c.fillRect(w * 0.52, h * 0.2, w * 0.13, h * 0.4);
    for (let i = 0; i < 7; i++)
      c.fillRect(w * 0.12 + i * w * 0.1, h * 0.6 - i * 2, 3, 20);
  } else if ([2, 3].includes(motif)) {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i === 1 ? m.accent : "#e8d9b5";
      c.fillRect(
        w * (0.12 + i * 0.27),
        h * (0.32 + (i % 2) * 0.05),
        w * 0.22,
        h * 0.28,
      );
      c.fillStyle = m.color;
      c.fillRect(w * (0.16 + i * 0.27), h * 0.4, 3, 4);
      c.fillRect(w * (0.24 + i * 0.27), h * 0.4, 3, 4);
    }
    c.fillStyle = m.accent;
    c.fillRect(w * 0.1, h * 0.66, w * 0.8, 6);
  } else {
    c.fillStyle = m.accent;
    c.beginPath();
    c.arc(w * 0.5, h * 0.34, w * 0.3, 0, 7);
    c.fill();
    c.fillStyle = m.color;
    c.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.25);
    c.fillStyle = "#292433";
    c.fillRect(w * 0.38, h * 0.39, w * 0.12, h * 0.26);
    c.fillRect(w * 0.54, h * 0.43, w * 0.1, h * 0.22);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = m.accent;
      c.globalAlpha = 0.2;
      c.fillRect((i * 21) % w, h * 0.65, 13, h * 0.2);
    }
    c.globalAlpha = 1;
  }
  c.fillStyle = "#1b1822dd";
  c.fillRect(0, h * 0.76, w, h * 0.24);
  c.fillStyle = "#f3e7cf";
  c.textAlign = "center";
  c.font = `bold ${Math.floor(w / 10)}px sans-serif`;
  const mid = Math.ceil(m.title.length / 2);
  if (m.title.length > 6) {
    c.fillText(m.title.slice(0, mid), w / 2, h * 0.85);
    c.fillText(m.title.slice(mid), w / 2, h * 0.93);
  } else c.fillText(m.title, w / 2, h * 0.9);
  c.textAlign = "start";
}
