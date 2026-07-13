// One-off extraction script (Milestone 1, Step 1).
// Parses the canonical balance spreadsheets into JSON under src/game/data/.
// Run with: npm run extract-xlsx
//
// The .xlsx files are the authoritative numeric source per the doc package's
// README; the .md summary tables are rounded transcriptions. We parse the raw
// sheets, map the (header-in-first-row) columns by position, and cross-check a
// few known anchors against the .md summaries before writing.

import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const outDir = path.join(root, 'src', 'game', 'data');

// Elements are not carried in the stat spreadsheet (the sheet is stat-only).
// Assign a deterministic element cycle across tiers so the monster codex has
// something to track. JUDGMENT CALL — docs leave per-tier element unspecified.
const ELEMENT_CYCLE = ['화', '수', '뇌', '지', '성', '암'];

function sheetRows(wb, name) {
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: true });
}

function extractMonsters() {
  const wb = XLSX.read(readFileSync(path.join(docsDir, 'arcane_shell_monster_stats.xlsx')), {
    type: 'buffer',
  });
  const rows = sheetRows(wb, '몬스터 스탯');
  // Row 0 is the header row; tier rows follow. Columns (by __EMPTY index):
  //   key='티어별 몬스터 스탯' -> tier
  //   __EMPTY   구간(section)  __EMPTY_1 종류(kind 일반/보스)
  //   __EMPTY_2 HP(normal)     __EMPTY_4 방어력(normal)
  //   __EMPTY_7 보스 실제 HP   __EMPTY_8 보스 실제 방어력
  //   __EMPTY_9 마석 등급       __EMPTY_10 등급시작티어 __EMPTY_11 등급끝티어
  //   __EMPTY_12 일반 최대수량  __EMPTY_13 최종 최소수량 __EMPTY_14 최종 최대수량
  const monsters = [];
  for (const r of rows) {
    const tier = r['티어별 몬스터 스탯'];
    if (typeof tier !== 'number') continue;
    const isBoss = r['__EMPTY_1'] === '보스';
    const normalHp = r['__EMPTY_2'];
    const normalDef = r['__EMPTY_4'];
    const bossHp = r['__EMPTY_7'];
    const bossDef = r['__EMPTY_8'];
    monsters.push({
      tier,
      section: r['__EMPTY'],
      isBoss,
      element: ELEMENT_CYCLE[(tier - 1) % ELEMENT_CYCLE.length],
      // baseHp/baseDefense = the tier's normal-monster stats (sheet HP column).
      baseHp: normalHp,
      baseDefense: normalDef,
      // Effective combat stats: on a boss tier the real target is the boss,
      // whose actual HP/defense are the sheet's "보스 실제" columns (5x / 2x).
      hp: isBoss ? bossHp : normalHp,
      defense: isBoss ? bossDef : normalDef,
      manaStoneGrade: r['__EMPTY_9'],
      gradeStartTier: r['__EMPTY_10'],
      gradeEndTier: r['__EMPTY_11'],
      // Drop is a direct [min,max] range, no probability roll (boss tiers'
      // rows already carry the boss-adjusted min/max in these columns).
      dropMin: r['__EMPTY_13'],
      dropMax: r['__EMPTY_14'],
    });
  }
  return monsters;
}

function extractTreeNodes() {
  const wb = XLSX.read(readFileSync(path.join(docsDir, 'arcane_shell_tree_node_cost.xlsx')), {
    type: 'buffer',
  });
  const rows = sheetRows(wb, '깊이별 비용');
  // key='깊이별 노드 해금 비용 (1강 기준)' -> depth
  //   __EMPTY 랭크(rank) __EMPTY_1 요구 마석 등급(grade) __EMPTY_2 1강 비용(baseCost)
  const nodes = [];
  for (const r of rows) {
    const depth = r['깊이별 노드 해금 비용 (1강 기준)'];
    if (typeof depth !== 'number') continue;
    nodes.push({
      depth,
      rank: r['__EMPTY'],
      grade: r['__EMPTY_1'],
      baseCost: r['__EMPTY_2'],
    });
  }
  return nodes;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Sanity check FAILED: ${msg}`);
  console.log(`  ok: ${msg}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const monsters = extractMonsters();
  const treeNodes = extractTreeNodes();

  console.log('Cross-checking against .md summary anchors:');
  const t22 = monsters.find((m) => m.tier === 22);
  assert(t22.baseHp === 3913539300, `tier22 base HP = ${t22.baseHp} ≈ 3,913,539,300 (.md anchor)`);
  assert(t22.isBoss && t22.hp === 19567696500, `tier22 boss real HP = ${t22.hp} (5x base)`);
  const t1 = monsters.find((m) => m.tier === 1);
  assert(t1.hp === 50, `tier1 HP = ${t1.hp} = 50`);
  const t5 = monsters.find((m) => m.tier === 5);
  assert(t5.isBoss && t5.hp === 1265.625, `tier5 boss HP = ${t5.hp} (5x base 253.125)`);

  const grade1Sum = treeNodes
    .filter((n) => n.grade === 1)
    .reduce((a, n) => a + n.baseCost, 0);
  assert(Math.round(grade1Sum) === 4814, `grade-1 tree cost sum = ${grade1Sum.toFixed(2)} ≈ 4,814`);
  assert(treeNodes.length === 55, `55 tree depths parsed (got ${treeNodes.length})`);
  assert(monsters.length === 22, `22 monster tiers parsed (got ${monsters.length})`);

  await writeFile(path.join(outDir, 'monsters.json'), JSON.stringify(monsters, null, 2), 'utf8');
  await writeFile(path.join(outDir, 'treeNodes.json'), JSON.stringify(treeNodes, null, 2), 'utf8');
  console.log(`\nWrote ${monsters.length} monsters and ${treeNodes.length} tree nodes to src/game/data/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
