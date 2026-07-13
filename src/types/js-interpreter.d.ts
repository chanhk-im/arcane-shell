// Minimal typings for the 'js-interpreter' npm package (NeilFraser JS-Interpreter).
// Only the surface we use. The interpreter walks the AST (acorn) and never uses
// eval/new Function, which is why it satisfies CLAUDE.md §3/§4.

declare module 'js-interpreter' {
  export type PseudoValue = unknown;

  export interface InterpreterObject {
    createNativeFunction(fn: (...args: PseudoValue[]) => PseudoValue): PseudoValue;
    setProperty(obj: PseudoValue, name: string, value: PseudoValue): void;
    step(): boolean;
    run(): boolean;
    readonly globalObject: PseudoValue;
  }

  export default class Interpreter implements InterpreterObject {
    constructor(
      code: string,
      initFunc?: (interpreter: Interpreter, globalObject: PseudoValue) => void,
    );
    createNativeFunction(fn: (...args: PseudoValue[]) => PseudoValue): PseudoValue;
    setProperty(obj: PseudoValue, name: string, value: PseudoValue): void;
    step(): boolean;
    run(): boolean;
    readonly globalObject: PseudoValue;
  }
}
