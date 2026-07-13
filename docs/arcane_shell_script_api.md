# Arcane Shell — 스크립트 API 명세 (전투 API / 자원 API)

> "api"가 명시된 시스템만 스크립트에서 접근 가능하다는 원칙에 따라, 현재 열려있는 두 시스템(전투/자원)을 상세 설계합니다. 향후 콘텐츠 추가 시 이 문서와 같은 형식으로 확장합니다.

---

## 0. 설계 원칙

- **읽기(조회)는 자유, 쓰기(행동)는 `cast` 계열 함수로만** — 자원을 직접 조작하는 함수는 없음 (예: `mana.current = 100` 같은 대입 불가, 전부 조회 전용 프로퍼티)
- **모든 조회 함수는 동기(sync)** — 스크립트 루프 안에서 바로 값을 받아 판단
- **에러 발생 시 해당 스크립트 즉시 종료** (기존 원칙 유지, 이 문서의 함수들도 동일)
- 네이밍은 실제 프로그래밍 API를 흉내낸 스타일 유지 (`camelCase`, dot-notation)

---

## 1. 전투 API (`combat`)

### 1-0. `Target` 타입

`cast()`의 두 번째 인자로 넘기는 `Target`은 **`target.current` 또는 `target.list()`가 반환한 `TargetInfo` 객체를 그대로 재사용**하는 것입니다. 별도의 타입이 아니라 `TargetInfo`의 별칭입니다.

```js
// target.list()로 여러 마리를 받아서, 그 중 하나를 직접 지정해 시전
const enemies = target.list(3);
const bossTarget = enemies.find(e => e.isBoss);
if (bossTarget) cast("fire_skill", bossTarget);
```

이렇게 하면 `target.set()`으로 "현재 타겟"을 바꾸지 않고도, **여러 몬스터 중 원하는 대상 하나를 골라 즉시 시전**할 수 있습니다 — 균열처럼 한 화면에 몬스터가 여럿 잡히는 상황에서 특히 유용합니다. `target`을 생략하면 기존과 동일하게 `target.current`가 쓰입니다.

### 1-1. 시전 함수

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `cast` | `cast(spellId: string, target?: Target): CastResult` | 스킬 시전. 타겟 생략 시 `target.current` 사용. **실패 조건(마나 부족/쿨타임/타겟 없음)은 예외를 던집니다** — 아래 1-1a 참고 |
| `isReady` | `isReady(spellId: string): boolean` | 해당 스킬(주로 버프)이 쿨타임 아닌지 확인 |
| `canAfford` | `canAfford(spellId: string): boolean` | 현재 마나로 시전 가능한지 확인 |

**`CastResult` 반환 구조** (시전이 성공했을 때만 반환됨 — 실패는 예외이므로 `success` 필드 불필요)
```ts
{
  hit: boolean,          // 명중 여부
  crit: boolean,         // 크리티컬 여부
  hitCount: number,      // 실제 히트 수 (GPU 보조옵션 반영)
  killed: boolean        // 이 시전으로 타겟이 죽었는지
}
```

### 1-1a. `cast` 예외 처리

`cast`는 실패 시 **타입이 있는 예외(catchable exception)** 를 던집니다. `isReady`/`canAfford`로 미리 확인하지 않고 바로 `cast`를 호출해도 되고, `try/catch`로 실패 케이스를 직접 다룰 수도 있습니다.

| 예외 타입 | 발생 조건 |
|---|---|
| `InsufficientManaError` | 마나 부족 |
| `CooldownError` | 버프 스킬 쿨타임 중 |
| `NoTargetError` | 유효한 타겟 없음 |

```js
try {
  cast("fire_skill");
} catch (e) {
  if (e.type === "InsufficientMana") sleep(500);
  else if (e.type === "NoTarget") target.set("nearest");
  // 여기서 잡지 않은 예외(위 3종 이외)는 기존 원칙대로 스크립트 즉시 종료
}
```

이 3종 예외를 `catch`하지 않고 그냥 두면, 기존 원칙("에러 발생 시 즉시 종료")대로 스크립트가 종료됩니다. 즉 **기본 동작은 그대로 유지하면서, 원하는 스크립트는 이 세 가지 케이스만 선택적으로 살려서 처리할 수 있게** 한 것입니다.

### 1-2. 스킬 정보 조회

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `getSpells` | `getSpells(): SpellInfo[]` | 현재 보유(해금된) 스킬 전체 목록 |
| `getSpellInfo` | `getSpellInfo(spellId: string): SpellInfo` | 특정 스킬 상세 정보 |

**`SpellInfo` 구조**
```ts
{
  id: string,
  element: "화"|"수"|"뇌"|"지"|"성"|"암",
  grade: 1|2|3|4|5,
  type: "딜"|"버프",
  manaCost: number,       // 최대마나 대비 %
  cooldown: number,       // 초 (버프 전용, 딜 스킬은 0)
  duration: number        // 초 (버프 전용)
}
```

### 1-3. 타겟 API

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `target.current` | `TargetInfo` (프로퍼티) | 현재 지정된 타겟 정보 |
| `target.set` | `target.set(selector: string): boolean` | 타겟 변경, 성공 여부 반환 |
| `target.list` | `target.list(count?: number = 5): TargetInfo[]` | 현재 사냥터(균열 포함)에서 감지 가능한 몬스터 목록. `count`로 몇 마리까지 받을지 지정 (기본 5, 최대 20 — 시스템 메모리 사용량에 비례해 상한 존재) |

**`target.set` 선택자(selector) 목록**

| 선택자 | 의미 |
|---|---|
| `"nearest"` | 가장 먼저 감지된 몬스터 (기본값과 동일) |
| `"weakest"` | 남은 HP%가 가장 낮은 몬스터 |
| `"boss"` | 현재 사냥터의 보스 (없으면 실패) |
| `"element:화"` | 지정 속성을 가진 몬스터 중 우선 |
| `"element:advantage"` | 보유 스킬 대비 상성이 유리한 속성의 몬스터 우선 |

**`TargetInfo` 구조**
```ts
{
  tier: number,           // 1~22
  isBoss: boolean,
  element: "화"|"수"|"뇌"|"지"|"성"|"암",
  hpPercent: number,      // 0~100
  defense: number,
  manaStoneGrade: 1|2|3|4|5
}
```

### 1-4. 버프 상태 조회

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `self.buffs` | `self.buffs(): ActiveBuff[]` | 현재 걸려있는 버프와 남은 지속시간 |

```ts
// ActiveBuff
{ spellId: string, remaining: number }  // remaining: 초
```

---

## 2. 자원 API (`resource`)

### 2-1. 마나 (플레이어 자원)

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `mana.current` | `number` | 현재 마나 |
| `mana.max` | `number` | 최대 마나 (마나 스탯 기반) |
| `mana.regenRate` | `number` | 초당 회복량 |

### 2-2. 마석 (등급별 조회 필수 — 5등급 개별 관리)

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `resource.manaStone` | `resource.manaStone(grade: 1|2|3|4|5): number` | 특정 등급 마석 보유량 |
| `resource.manaStoneAll` | `resource.manaStoneAll(): Record<number, number>` | 전체 등급 마석 보유량 한번에 |

### 2-3. 기타 재화

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `resource.get` | `resource.get(type: "gold"|"fame"|"bossmaterial"): number` | 골드/명성/보스재화 보유량 |

### 2-4. 인벤토리 (읽기 전용 — 제작/강화는 API 없음, 수동 조작만)

| 함수 | 시그니처 | 설명 |
|---|---|---|
| `inventory.parts` | `inventory.parts(): PartInfo[]` | 보유 부품(CPU/GPU/HDD/RAM/메인보드) 목록 |
| `inventory.runes` | `inventory.runes(): RuneInfo[]` | 보유 룬 목록 |
| `inventory.relics` | `inventory.relics(): RelicInfo[]` | 보유 유물 목록, 장착 여부 포함 |

```ts
// PartInfo
{ type: "CPU"|"GPU"|"HDD"|"RAM"|"메인보드", grade: 1-5, level: 0-25 }
// RuneInfo
{ rarity: 1-5, options: [{ stat: string, grade: 1-5, value: number }] }
// RelicInfo
{ id: string, equipped: boolean }
```

### 2-5. 시스템 자원 (스크립트/매크로 관리용)

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `system.memoryUsed` | `number` | 현재 실행 중인 스크립트들의 총 메모리 사용량 |
| `system.memoryMax` | `number` | 메모리 용량 상한 (RAM 부품+룬+유물2 반영) |

---

## 3. 종합 예시 스크립트

```js
// 마나 관리 + 상성 대응 + 자원 기반 판단을 모두 사용하는 예시

while (true) {
  // 1. 위험한 마나 상황이면 잠깐 대기 (버프 없이 딜만 계속하면 가동률 이슈)
  if (mana.current < mana.max * 0.15) {
    sleep(1000);
    continue;
  }

  // 2. 상성 유리한 타겟으로 우선 전환
  target.set("element:advantage");
  const enemy = target.current;

  // 3. 마나 여유 있고 보스전이면 과부하 버프 사용
  if (enemy.isBoss && mana.current > mana.max * 0.6 && isReady("overload_buff")) {
    cast("overload_buff");
  }

  // 4. 상성에 맞는 딜 스킬 선택 후 시전 (실패는 예외로 옴)
  const spell = pickSkillByElement(enemy.element);
  try {
    const result = cast(spell);
    if (result.killed) log(`${enemy.tier}티어 처치 완료`);
  } catch (e) {
    if (e.type === "InsufficientMana") sleep(500);
    else if (e.type === "NoTarget") target.set("nearest");
    // 그 외 예외는 잡지 않았으므로 스크립트 종료
  }
}

function pickSkillByElement(elem) {
  const advantage = { "화": "수", "수": "뇌", "뇌": "지", "지": "화" };
  return advantage[elem] ? `${advantage[elem]}_skill` : "neutral_skill";
}
```

## 4. 향후 확장 시 규칙

새 콘텐츠에 스크립트 접근을 열 때는:
1. 해당 시스템 이름에 **"api" 태그**를 명시 (예: "차원균열-api")
2. 이 문서와 같은 형식(함수 표 + 반환 구조 + 예시)으로 별도 절 추가
3. 쓰기 함수는 신중하게 — 원칙적으로 "행동"(cast류)만 쓰기 허용, 조회는 전부 읽기 전용 유지

## 5. 결정 완료 (이전 미해결 사항)

1. ✅ `target.list(count)` — 옵션 파라미터로 확정 (기본 5, 최대 20)
2. ✅ `cast` 실패 처리 — 예외(`InsufficientManaError`/`CooldownError`/`NoTargetError`) 방식으로 확정. 잡지 않으면 기존 원칙대로 스크립트 종료, 잡으면 선택적으로 복구 로직 실행 가능
3. ✅ 에러 로그 여부 — 예외 객체에 `e.type`이 담기므로 `catch` 블록에서 원한다면 `log()`로 직접 남길 수 있음(강제 아님, 스크립트 작성자 재량)

## 6. 새로 남은 것

- `target.list`의 최대 20 상한이 적절한지 (균열 5곳 기준 사냥터당 평균 4마리 노출 정도로 역산한 수치, 실제 밸런스 검증 필요)
- 예외 타입을 더 세분화할지 (예: 방어구/부품 관련 예외 등 향후 시스템 추가 시)
