import { useEffect, useRef } from 'react';
import { useScriptRunner, useScriptActions } from '../hooks/useScriptRunner';
import { useUIStore } from '../stores/useUIStore';

// Script editor view (side-panel "스크립트" tab). Code runs in a real Web
// Worker via the sandboxed interpreter — the editor never touches the worker
// directly, it calls the host through the action hook.
export default function ScriptView() {
  const { source, running, consoleOutput, memoryUsed, memoryMax, supported } = useScriptRunner();
  const { setSource, clearConsole, run, stop } = useScriptActions();
  const consoleRef = useRef<HTMLDivElement>(null);
  const docsInsertRequest = useUIStore((s) => s.docsInsertRequest);
  const clearDocsInsertRequest = useUIStore((s) => s.clearDocsInsertRequest);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [consoleOutput]);

  // ui_spec §3-12 "에디터에 삽입": docs panel requests a snippet insert, then
  // hands control back here — a cross-tab event, so an effect boundary fits
  // (CLAUDE.md §1-4).
  useEffect(() => {
    if (docsInsertRequest === null) return;
    setSource(source.length > 0 ? `${source}\n${docsInsertRequest}` : docsInsertRequest);
    clearDocsInsertRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsInsertRequest]);

  return (
    <div>
      <div className="panel">
        <h2>Script Sandbox</h2>
        <div className="pill">
          유저 코드는 Web Worker 안에서 AST 인터프리터로 실행됩니다 (eval/new Function 미사용). 무한루프는
          스텝 예산 초과로, 그 외 에러는 즉시 종료됩니다.
        </div>
        {!supported && (
          <div className="notice" style={{ marginTop: 8 }}>
            SharedArrayBuffer를 사용할 수 없습니다 (cross-origin isolation 필요). dev 서버를 재시작하세요.
          </div>
        )}
      </div>

      <textarea
        className="editor"
        value={source}
        spellCheck={false}
        disabled={running}
        onChange={(e) => setSource(e.target.value)}
      />

      <div className="toolbar">
        {running ? (
          <button className="danger" onClick={stop}>
            ■ Stop
          </button>
        ) : (
          <button className="primary" onClick={() => run(source)} disabled={!supported}>
            ▶ Run
          </button>
        )}
        <button onClick={clearConsole} disabled={running}>
          Clear console
        </button>
        <button onClick={() => setActiveTab('docs')}>[문서]</button>
        <span className="pill">
          memory {memoryUsed}/{memoryMax} · {running ? 'running' : 'idle'}
        </span>
      </div>

      <div className="panel">
        <h2>Console</h2>
        <div className="console" ref={consoleRef}>
          {consoleOutput.map((line, i) => (
            <div key={i} className="line">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
