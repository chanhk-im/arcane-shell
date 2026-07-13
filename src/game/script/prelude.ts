// The whitelisted script API, defined entirely in interpreted-JS terms and
// backed by three native functions the worker injects: __call (SAB round-trip
// to the main thread), __log, and sleep. User code sees ONLY the surface below
// — never the stores (CLAUDE.md §3). Every method maps to script_api.md.
//
// __call(method, argJson) returns a JSON string { v: value } on success or
// { e: {type,name,message} } on failure; __invoke unwraps it and throws the
// error object so user try/catch can inspect e.type (script_api.md §1-1a).

export const API_PRELUDE = `
function __invoke(method, arg) {
  var raw = __call(method, JSON.stringify(arg === undefined ? null : arg));
  var res = JSON.parse(raw);
  if (res && res.e) {
    // Fatal errors (no .type) aren't in the 3 catchable kinds; surface the
    // message to the console before throwing, since an uncaught interpreter
    // throw doesn't carry a readable message back to the host.
    if (!res.e.type) { __log('[fatal] ' + (res.e.message || 'script error')); }
    throw res.e;
  }
  return res ? res.v : undefined;
}

function cast(spellId, tgt) {
  return __invoke('cast', { spellId: spellId, target: tgt === undefined ? null : tgt });
}
function isReady(spellId) { return __invoke('isReady', spellId); }
function canAfford(spellId) { return __invoke('canAfford', spellId); }
function getSpells() { return __invoke('getSpells'); }
function getSpellInfo(spellId) { return __invoke('getSpellInfo', spellId); }

var target = {
  set: function (selector) { return __invoke('target.set', selector); },
  list: function (count) { return __invoke('target.list', count === undefined ? 5 : count); }
};
Object.defineProperty(target, 'current', {
  get: function () { return __invoke('target.current'); }
});

var self = { buffs: function () { return __invoke('self.buffs'); } };

var mana = {};
Object.defineProperty(mana, 'current', { get: function () { return __invoke('mana.current'); } });
Object.defineProperty(mana, 'max', { get: function () { return __invoke('mana.max'); } });
Object.defineProperty(mana, 'regenRate', { get: function () { return __invoke('mana.regenRate'); } });

var resource = {
  get: function (type) { return __invoke('resource.get', type); },
  manaStone: function (grade) { return __invoke('resource.manaStone', grade); },
  manaStoneAll: function () { return __invoke('resource.manaStoneAll'); }
};

var system = {};
Object.defineProperty(system, 'memoryUsed', { get: function () { return __invoke('system.memoryUsed'); } });
Object.defineProperty(system, 'memoryMax', { get: function () { return __invoke('system.memoryMax'); } });

function log(msg) { __log(String(msg)); }
`;
