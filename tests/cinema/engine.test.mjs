import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../../prototypes/browser/engine.mjs";
function resolve(s, manual = false) {
  const e = E.currentEvent(s);
  let choice = "staff",
    replacement = null;
  if (e.kind === "repair") choice = "standard";
  if (e.kind === "thanks") choice = "accept";
  if (e.kind === "withdrawal") {
    replacement = E.replacementOptions(s, e)[0]?.id;
    choice = replacement ? "replace" : "cancel";
  }
  if (manual && ["tickets", "snacks", "cleaning"].includes(e.kind))
    choice = "manual";
  assert.equal(E.resolveEvent(s, choice, 1, replacement), null);
}
function finish(s, chunk = 180, manual = false) {
  let guard = 0;
  while (s.phase !== "closed") {
    if (++guard > 10000) throw Error("Day did not complete");
    if (s.phase === "event") resolve(s, manual);
    else E.advance(s, chunk);
  }
  return s.history[0];
}
function start(s) {
  assert.equal(E.startDay(s), null);
  return s;
}
function planAll(s) {
  for (const b of s.branches) b.programme = E.suggestProgramme(s, b.id);
}

test("normal speed day is 180 simulated seconds; pause freezes all stores", () => {
  const s = start(E.createGame());
  s.events = [];
  E.advance(s, 60);
  assert.equal(s.phase, "running");
  assert.equal(s.minute, 260);
  const time = s.elapsed;
  s.paused = true;
  E.advance(s, 60);
  assert.equal(s.elapsed, time);
  s.paused = false;
  E.advance(s, 119);
  assert.equal(s.phase, "running");
  E.advance(s, 1);
  assert.equal(s.phase, "closed");
  assert.equal(s.elapsed, 180);
});
test("large accelerated steps preserve event stops and cannot jump to day end", () => {
  const s = start(E.createGame());
  E.advance(s, 180);
  assert.equal(s.phase, "event");
  assert.ok(s.elapsed < 180);
  assert.equal(s.events.filter((e) => e.done).length, 0);
  const time = s.elapsed;
  E.advance(s, 100);
  assert.equal(s.elapsed, time);
  resolve(s);
  finish(s);
  assert.ok(s.events.every((e) => e.done));
});
test("same-minute events in different branches both stop and resolve", () => {
  const s = E.createGame();
  assert.equal(E.openBranch(s), null);
  planAll(s);
  start(s);
  s.events = [
    { id: "a", kind: "tickets", at: 60, branch: 0, hall: 0, done: false },
    { id: "b", kind: "snacks", at: 60, branch: 1, hall: 0, done: false },
  ];
  E.advance(s, 180);
  assert.equal(E.currentEvent(s).id, "a");
  resolve(s);
  E.advance(s, 180);
  assert.equal(E.currentEvent(s).id, "b");
  resolve(s);
  finish(s);
  assert.ok(s.events.every((e) => e.done));
});
test("deterministic finances match whether advancing in small or large steps", () => {
  const a = start(E.createGame()),
    b = start(E.createGame());
  const x = finish(a, 0.17),
    y = finish(b, 180);
  assert.deepEqual(x, y);
  assert.equal(a.cash, b.cash);
});
test("all ticket, food, operating and investment cash flows reconcile", () => {
  const s = E.createGame();
  assert.equal(E.upgrade(s, 0, "decor"), null);
  const r = finish(start(s));
  const l = r.rows[0].ledger;
  assert.equal(
    l.foodCost,
    l.snackUnits.reduce((n, q, i) => n + q * E.FOODS[i].cost, 0),
  );
  assert.equal(
    l.foodRevenue,
    l.snackUnits.reduce((n, q, i) => n + q * s.branches[0].foods[i], 0),
  );
  assert.equal(
    l.groups.reduce((a, b) => a + b, 0),
    l.admissions,
  );
  assert.ok(
    Math.abs(
      r.openingCash +
        r.net -
        r.investment -
        r.rows.reduce((n, row) => n + row.ledger.loanPayment, 0) -
        r.closingCash,
    ) < 0.000001,
  );
  for (const p of s.branches[0].shows)
    assert.ok(p.served <= s.branches[0].seats[p.hall]);
});
test("buying property charges price once, removes rent, and retains maintenance", () => {
  const s = E.createGame();
  s.cash = 100000;
  assert.equal(E.buyProperty(s, 0), null);
  assert.equal(s.cash, 28000);
  assert.equal(s.branches[0].owned, true);
  const before = s.cash;
  assert.ok(E.buyProperty(s, 0));
  assert.equal(s.cash, before);
  const r = finish(start(s));
  assert.equal(r.rows[0].ledger.rent, 0);
  assert.ok(r.rows[0].ledger.maintenance > 0);
});
test("second branch requires player programming and does not share staff or prices", () => {
  const s = E.createGame();
  assert.equal(E.openBranch(s), null);
  assert.equal(s.cash, 14000);
  assert.equal(s.branches[1].programme.length, 0);
  assert.match(E.startDay(s), /尚未排片/);
  s.branches[1].programme = E.suggestProgramme(s, 1);
  s.branches[1].foods[0] = 55;
  s.branches[1].staff[0].role = "cleaning";
  assert.equal(s.branches[0].foods[0], 32);
  assert.equal(s.branches[0].staff[0].role, "tickets");
  const r = finish(start(s));
  assert.equal(r.rows.length, 2);
  assert.ok(r.rows.every((r) => r.ledger.rent > 0));
});
test("overlaps, cleaning buffers, bad prices, hours, unavailable and banned films block opening", () => {
  const s = E.createGame(),
    p = s.branches[0].programme[0];
  assert.ok(
    E.validateProgramme(s, [p, { ...p, id: "other", start: p.start + 120 }])
      .length,
  );
  for (const patch of [
    { start: -5 },
    { start: 779 },
    { price: 0 },
    { price: Infinity },
    { movie: "m8" },
    { format: "IMAX" },
    { hall: 2 },
  ])
    assert.ok(E.validateProgramme(s, [{ ...p, ...patch }]).length);
  s.bans[p.movie] = 3;
  assert.ok(E.validateProgramme(s, [p]).length);
  const original = s.branches[0].programme;
  assert.ok(E.setProgramme(s, 0, [{ ...p, price: 0 }]));
  assert.strictEqual(s.branches[0].programme, original);
});
test("ticket demand falls at high prices and weekly films become available", () => {
  const a = E.createGame(),
    b = E.createGame();
  b.branches[0].programme.forEach((p) => (p.price = 300));
  const demand = (s) =>
    E.buildDemand(s, s.branches[0]).reduce((n, p) => n + p.demand, 0);
  assert.ok(demand(b) < demand(a));
  assert.ok(!E.availableMovies(a).some((m) => m.id === "m8"));
  a.day = 8;
  assert.ok(E.availableMovies(a).some((m) => m.id === "m8"));
  const m = E.movie("m0");
  assert.ok(E.heat(m, 8) < E.heat(m, 1));
  assert.ok(
    E.heat(E.movie("m7"), 15) / E.heat(E.movie("m7"), 1) >
      E.heat(m, 15) / E.heat(m, 1),
  );
});
test("manual intervention improves real food sales; no arbitrary cash reward", () => {
  const a = start(E.createGame()),
    b = start(E.createGame());
  E.advance(a, 180);
  E.advance(b, 180);
  assert.equal(E.currentEvent(a).kind, "snacks");
  const cash = b.cash;
  assert.equal(E.resolveEvent(b, "manual", 1), null);
  assert.equal(b.cash, cash);
  assert.equal(E.resolveEvent(a, "staff"), null);
  const x = finish(a),
    y = finish(b);
  assert.ok(y.rows[0].ledger.foodRevenue > x.rows[0].ledger.foodRevenue);
  assert.ok(y.net > x.net);
});
test("withdrawal prevents banned screenings across both branches and replaces only future slots", () => {
  const s = E.createGame();
  E.openBranch(s);
  planAll(s);
  start(s);
  const id = s.branches[0].shows[2].movie;
  s.events = [
    {
      id: "ban",
      kind: "withdrawal",
      at: 20,
      branch: 0,
      hall: 0,
      movie: id,
      done: false,
    },
  ];
  E.advance(s, 180);
  assert.equal(s.phase, "event");
  assert.ok(E.isBanned(s, id));
  const replacement = E.replacementOptions(s, E.currentEvent(s))[0];
  assert.ok(replacement);
  assert.equal(E.resolveEvent(s, "replace", 0, replacement.id), null);
  for (const b of s.branches)
    assert.ok(b.shows.every((p) => p.booked || p.cancelled || p.movie !== id));
  finish(s);
  E.nextDay(s);
  for (const b of s.branches)
    assert.ok(b.programme.every((p) => p.movie !== id));
});
test("urgent repair reopens sooner and incurs actual event cost", () => {
  const s = start(E.createGame());
  s.events = [
    { id: "fix", kind: "repair", at: 120, branch: 0, hall: 1, done: false },
  ];
  E.advance(s, 180);
  const cash = s.cash;
  assert.equal(E.resolveEvent(s, "urgent"), null);
  assert.equal(s.branches[0].closedUntil[1], 165);
  assert.equal(s.cash, cash - 2400);
  assert.equal(s.branches[0].ledger.eventCost, 2400);
});
test("cash shortage cannot silently pay for investment, repairs or hiring", () => {
  const s = E.createGame();
  s.cash = 0;
  assert.ok(E.openBranch(s));
  assert.ok(E.buyProperty(s, 0));
  assert.ok(E.hire(s, 0));
  assert.equal(s.cash, 0);
  assert.equal(s.branches.length, 1);
  assert.equal(s.branches[0].owned, false);
});
test("save/load restores pending events and pauses running saves without offline gains", () => {
  for (const phase of ["planning", "running", "event", "closed"]) {
    let s = E.createGame();
    if (phase !== "planning") {
      start(s);
      if (phase === "event") E.advance(s, 180);
      if (phase === "closed") finish(s);
    }
    const cash = s.cash,
      elapsed = s.elapsed,
      loaded = E.loadGame(E.saveGame(s));
    assert.equal(loaded.phase, s.phase);
    assert.equal(loaded.cash, cash);
    assert.equal(loaded.elapsed, elapsed);
    if (phase === "running") assert.equal(loaded.paused, true);
    if (phase === "event")
      assert.equal(E.currentEvent(loaded).id, E.currentEvent(s).id);
  }
  assert.throws(() => E.loadGame("{}"));
  const s = E.createGame();
  s.branches[0].staff[0].skill = Infinity;
  assert.throws(() => E.loadGame(E.saveGame(s)));
});
test("campaign reaches both property ownership and a personally managed second store", () => {
  const s = E.createGame();
  let bought = false,
    opened = false;
  for (let i = 0; i < 12; i++) {
    if (!bought && s.cash >= E.PROPERTY_PRICE[0]) {
      assert.equal(E.buyProperty(s, 0), null);
      bought = true;
    }
    if (bought && !opened && s.cash >= E.BRANCH_PRICE + 5000) {
      assert.equal(E.openBranch(s), null);
      opened = true;
    }
    planAll(s);
    const r = finish(start(s), 180, true);
    assert.ok(Number.isFinite(r.net));
    if (i < 11) E.nextDay(s);
  }
  assert.ok(bought && opened);
  assert.equal(s.branches.length, 2);
  assert.equal(s.branches[0].owned, true);
  assert.ok(s.history.some((r) => r.rows.length === 2));
});
test("each branch has at most two interruption events and no-events days exist", () => {
  const s = E.createGame();
  let peaceful = false;
  for (let day = 1; day <= 14; day++) {
    s.day = day;
    s.phase = "planning";
    planAll(s);
    start(s);
    assert.ok(s.events.length <= 2);
    if (s.events.length === 0) peaceful = true;
    finish(s);
  }
  assert.ok(peaceful);
});
test("loan financing and daily repayments reconcile with the company cash ledger", () => {
  const s = E.createGame();
  E.emergencyLoan(s);
  const r = finish(start(s));
  assert.equal(r.financing, 20000);
  assert.equal(s.loan, 21800);
  assert.equal(r.rows[0].ledger.loanPayment, 200);
  assert.ok(
    Math.abs(
      r.openingCash + r.financing + r.net - r.investment - 200 - r.closingCash,
    ) < 1e-6,
  );
});
