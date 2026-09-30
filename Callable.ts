import Interpreter from "./Interpreter";
export interface Callable {
	arity(): number;
	call(interpreter: Interpreter, args: unknown[]): unknown;
	typeName?: string;
}
