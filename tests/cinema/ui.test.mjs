// DOM integration tests, not a substitute for visual browser playtesting.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import * as E from "../../prototypes/browser/engine.mjs";
import * as C from "../../prototypes/browser/construction.mjs";
const require = createRequire(
  new URL("../../prototypes/browser/package.json", import.meta.url),
);
const { JSDOM } = require("jsdom");

test("UI integrates scheduling, food pricing, two-store investment, all minigames, day close and saves", async () => {
  const html = await readFile(
    new URL("../../prototypes/browser/index.html", import.meta.url),
    "utf8",
  );
  const atlas = JSON.parse(
    await readFile(
      new URL("../../src/assets/cinema/runtime/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const dom = new JSDOM(html, {
    url: "https://lumen.test/",
    pretendToBeVisual: true,
  });
  const w = dom.window,
    d = w.document;
  const existing=E.createGame({construction:true});
  while(!C.operational(existing.branches[0])){
    const step=C.nextStep(existing.branches[0]);
    assert.equal(step.kind==='floor'?E.buildFloor(existing,0,step.x,step.y):E.constructRoom(existing,0,step.id),null);
  }
  const bootRaw=E.saveGame(existing);w.localStorage.setItem('lumen-cinema-v2',bootRaw);
  let nextFrame = null,
    now = 0,
    draws = 0;
  const ctx = new Proxy(
    {
      createImageData(width,height){return {data:new Uint8ClampedArray(width*height*4),width,height};},
      getImageData(x,y,width,height){return {data:new Uint8ClampedArray(width*height*4),width,height};},
      measureText(text){return {width:text.length*9};},
      drawImage() {
        draws++;
      },
    },
    { get: (t, k) => (k in t ? t[k] : () => {}) },
  );
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  Object.defineProperty(globalThis, "performance", {
    value: { now: () => now },
    configurable: true,
  });
  Object.assign(globalThis, {
    window: w,
    document: d,
    localStorage: w.localStorage,
    FormData: w.FormData,
    Image: class {
      width=1254;
      height=1254;
      async decode() {}
    },
    fetch: async () => {
      // The page can leave while assets are pending, before its old save loads.
      w.dispatchEvent(new w.Event('pagehide'));
      assert.equal(w.localStorage.getItem('lumen-cinema-v2'),bootRaw,'unread save must survive early pagehide');
      return { ok: true, json: async () => atlas };
    },
    requestAnimationFrame: (fn) => (nextFrame = fn),
  });
  const timers = [],
    originalTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (fn, ms, ...args) => {
    const id = originalTimeout(fn, ms, ...args);
    timers.push(id);
    return id;
  };
  const errors = [],
    originalError = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  const click = (selector) => {
    const el = d.querySelector(selector);
    assert.ok(el, "Missing " + selector);
    assert.equal(el.disabled, false, "Disabled " + selector);
    el.click();
  };
  const change = (selector, value) => {
    const el = d.querySelector(selector);
    assert.ok(el);
    el.value = String(value);
    el.dispatchEvent(new w.Event("change", { bubbles: true }));
  };
  const save = () => {
    click("#save-button");
    return JSON.parse(localStorage.getItem("lumen-cinema-v2")).state;
  };
  const restore = (s) => {
    localStorage.setItem("lumen-cinema-v2", E.saveGame(s));
    click("#load-button");
  };
  const close = () => click('#modal [data-action="close"]');
  try {
    await import("../../prototypes/browser/game.mjs?integration");
    assert.ok(d.querySelector("#modal").open);
    click('[data-action="resume-save"]');
    assert.deepEqual(w.__lumen.getState().branches[0].map,existing.branches[0].map);
    assert.equal(w.__lumen.getState().cash,existing.cash);
    assert.equal(d.querySelector('#main-action').textContent,'開始營業');
    click('#help-button');click('[data-action="reset-prompt"]');click('[data-action="commit-reset"]');
    assert.equal(w.localStorage.getItem('lumen-cinema-v2-before-reset'),bootRaw);
    click('#help-button');
    close();
    assert.ok(draws > 0, "Real sprite rendering path was exercised");
    assert.deepEqual(save().branches[0].map.floors,['6,6']);
    assert.equal(save().branches[0].map.built.length,0);
    click('[data-view="investment"]');click('[data-view="investment"][data-section="build"]');
    for(let i=0;i<15;i++)click('[data-action="construction-next"]');
    assert.equal(save().branches[0].map.built.length,4);
    assert.equal(save().cash,37600);
    for (const view of [
      "schedule",
      "movies",
      "staff",
      "snacks",
      "investment",
      "strategy",
      "report",
      "overview",
    ]) {
      click(`[data-view="${view}"]`);
      if(view==='overview')assert.ok(d.querySelector('#cinema'));else assert.ok(d.querySelector("#view-content").textContent.length > 30,view);
    }
    click('[data-view="schedule"]');
    // Exercise the actual game wiring, including persistence and no edit-on-drop.
    const originalPlan=save(),dragRoot=d.querySelector('.timeline-scroll'),dragTrack=d.querySelector('.timeline-track'),dragButton=d.querySelector('[data-schedule-drag]');
    const box=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
    dragRoot.getBoundingClientRect=()=>box(0,0,1000,300);
    dragTrack.getBoundingClientRect=()=>box(80,80,780,86);
    dragButton.getBoundingClientRect=()=>box(95,84,118,74);
    const pointer=(type,x)=>{const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:121});Object.defineProperties(e,{pointerId:{value:1},pointerType:{value:'touch'},isPrimary:{value:true}});dragButton.dispatchEvent(e)};
    pointer('pointerdown',154);pointer('pointermove',169);pointer('pointerup',169);
    assert.equal(w.__lumen.getState().branches[0].programme[0].start,30);
    assert.equal(JSON.parse(localStorage.getItem('lumen-cinema-v2')).state.branches[0].programme[0].start,30);
    assert.equal(w.__lumen.getState().cash,originalPlan.cash);
    assert.equal(d.querySelector('#modal').open,false);
    restore(originalPlan);click('[data-view="schedule"]');
    click('[data-action="edit-show"]');
    d.querySelector('[name="price"]').value = "105";
    d.querySelector("#programme-form").dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.ok(!d.querySelector("#modal").open);
    assert.equal(
      save().branches[0].programme.find((p) => p.start === 15 && p.hall === 0)
        .price,
      105,
    );
    click('[data-action="add-show"]');
    d.querySelector('[name="time"]').value = "11:00";
    d.querySelector("#programme-form").dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.match(d.querySelector("#form-error").textContent, /重疊/);
    close();
    click('[data-view="staff"]');click('[data-view="snacks"]');
    change('[data-food-price="0"]', 39);
    assert.equal(save().branches[0].foods[0], 39);
    click('[data-view="staff"]');
    change('[data-role-staff="1"]', "snacks");
    assert.equal(
      save().branches[0].staff.find((p) => p.id === 1).role,
      "snacks",
    );
    change('[data-role-staff="1"]', "tickets");
    const expandedBudget=save();expandedBudget.cash=100000;restore(expandedBudget);
    click('[data-view="investment"]');
    click('[data-action="open-branch"]');
    click('[data-action="commit-branch"]');
    assert.equal(save().branches.length, 2);
    assert.equal(save().branches[1].programme.length, 0);
    assert.deepEqual(save().branches[1].map.floors,['6,6']);
    click('[data-view="investment"]');click('[data-view="investment"][data-section="build"]');
    for(let i=0;i<15;i++)click('[data-action="construction-next"]');
    click('[data-view="schedule"]');
    click('[data-action="suggest-programme"]');
    assert.equal(save().branches[1].programme.length, 4);
    assert.equal(
      save().branches[0].programme.find((p) => p.start === 15 && p.hall === 0)
        .price,
      105,
    );
    const funded = E.createGame();
    funded.cash = 200000;
    funded.dayOpeningCash = 200000;
    restore(funded);
    click('[data-view="investment"]');
    click('[data-action="buy-property"]');
    click('[data-action="commit-property"]');
    assert.equal(save().branches[0].owned, true);
    assert.match(d.querySelector("#property-badge").textContent, /自置/);
    click('[data-action="upgrade"][data-key="decor"]');
    assert.equal(save().branches[0].upgrades.decor, 1);
    for (const kind of ["tickets", "snacks", "cleaning"]) {
      const s = E.createGame();
      E.startDay(s);
      s.events = [
        {
          id: "test-" + kind,
          kind,
          at: 1,
          branch: 0,
          hall: 0,
          movie: "m0",
          done: false,
        },
      ];
      E.advance(s, 180);
      restore(s);
      assert.ok(d.querySelector("#modal").open);
      click('[data-action="play-mini"]');
      if (kind === "tickets")
        for (let i = 0; i < 8; i++) {
          const request = [...d.querySelector("#mini-request").childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent)
            .join("")
            .trim();
          const option = [...d.querySelectorAll(".ticket-option")].find(
            (el) => el.textContent === request,
          );
          assert.ok(option);
          option.click();
        }
      if (kind === "snacks")
        for (let i = 0; i < 8; i++) {
          const text = d
            .querySelector("#mini-request")
            .textContent.replace("今張訂單", "");
          for (const item of text.split(" ＋ ")) {
            const id = item.includes("爆谷")
              ? 0
              : item.includes("汽水")
                ? 1
                : 2;
            click(`[data-action="snack-pick"][data-id="${id}"]`);
          }
        }
      if (kind === "cleaning")
        for (const trash of [...d.querySelectorAll(".trash")]) trash.click();
      assert.ok(
        d.querySelector(".result-stars"),
        kind + " should finish with a result",
      );
      click('[data-action="mini-complete"]');
      const played = save();
      assert.equal(played.phase, "running");
      assert.ok(played.branches[0].buffs[kind] > 0);
      assert.equal(
        played.cash,
        s.cash,
        "No arbitrary cash is granted by a minigame",
      );
    }
    const day = E.createGame();
    E.startDay(day);
    day.events = [];
    restore(day);
    assert.equal(save().paused, true);
    click("#pause-button");
    click('[data-speed="4"]');
    for (let i = 0; i < 260; i++) {
      now += 200;
      nextFrame(now);
    }
    const closed = save();
    assert.equal(closed.phase, "closed");
    assert.equal(closed.history.length, 1);
    click('[data-view="strategy"]');click('[data-view="report"]');
    assert.match(d.querySelector("#view-content").textContent, /日終公司現金/);
    click("#main-action");
    assert.equal(save().day, 2);
    assert.equal(save().phase, "planning");
    assert.deepEqual(errors, [], "No DOM handler or renderer errors");
  } finally {
    console.error = originalError;
    for (const id of timers) clearTimeout(id);
    globalThis.setTimeout = originalTimeout;
    dom.window.close();
  }
});
