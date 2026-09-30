import { Environment } from "../Environment";
import Interpreter from "../Interpreter";
import { Callable } from "../Callable";

// Used for a synchronous sleep in wait()
const sleepCell = new Int32Array(new SharedArrayBuffer(4));

const compareDefault = (a: unknown, b: unknown): number => {
	const x = a as number;
	const y = b as number;
	return x < y ? -1 : x > y ? 1 : 0;
};

export function injectGlobals(interpreter: Interpreter, globals: Environment): void {
	const NUMBER_TYPE = {
		typeName: "number",
		arity() {
			return 1;
		},
		call(_: Interpreter, args: unknown[]) {
			const n = Number(args[0]);
			return Number.isNaN(n) ? 0 : n;
		},
	};

	const STRING_TYPE = {
		typeName: "string",
		arity() {
			return 1;
		},
		call(_: Interpreter, args: unknown[]) {
			return String(args[0]);
		},
	};

	const BOOLEAN_TYPE = {
		typeName: "boolean",
		arity() {
			return 1;
		},
		call(_: Interpreter, args: unknown[]) {
			const val = args[0];
			return val !== undefined && val !== false;
		},
	};

	globals.define("typeOf", {
		arity() {
			return 1;
		},
		call(_, args) {
			const val = args[0];
			const jsType = typeof val;

			if (jsType === "number") return NUMBER_TYPE;
			if (jsType === "string") return STRING_TYPE;
			if (jsType === "boolean") return BOOLEAN_TYPE;

			return jsType;
		},
	});

	globals.define("number", NUMBER_TYPE);
	globals.define("string", STRING_TYPE);
	globals.define("boolean", BOOLEAN_TYPE);

	globals.define("print", {
		arity() {
			return 1;
		},
		call(_, args) {
			console.log("[ThoughtScript]", ...args);
		},
	});

	globals.define("os_clock", {
		arity() {
			return 0;
		},
		call() {
			return performance.now() / 1000;
		},
	});

	globals.define("wait", {
		arity() {
			return 1;
		},
		call(_, args) {
			const seconds = Math.max(0, Number(args[0]) || 0);
			Atomics.wait(sleepCell, 0, 0, seconds * 1000);
			return undefined;
		},
	});

	globals.define("length", {
		arity() {
			return 1;
		},
		call(_, args) {
			const collection = args[0];
			if (Array.isArray(collection) || typeof collection === "string") {
				return collection.length;
			}
			return 0;
		},
	});

	globals.define("sort", {
		arity() {
			return 2;
		},
		call(interpreter, args) {
			const list = args[0] as unknown[];
			const comparator = args[1] as Callable | undefined;

			if (!Array.isArray(list)) {
				throw "First argument to sort must be an array.";
			}

			if (comparator === undefined) {
				return list.sort(compareDefault);
			}

			return list.sort((a, b) => {
				const result = comparator.call(interpreter, [a, b]);
				if (typeof result === "number") return result;
				// Predicate-style comparators: true means "a goes first"
				return result === true ? -1 : 1;
			});
		},
	});

	globals.define("push", {
		arity() {
			return 2;
		},
		call(_, args) {
			const list = args[0] as unknown[];
			if (Array.isArray(list)) {
				list.push(args[1]);
			}
			return list;
		},
	});

	globals.define("pop", {
		arity() {
			return 1;
		},
		call(_, args) {
			const list = args[0] as unknown[];
			if (Array.isArray(list)) {
				return list.pop();
			}
			return undefined;
		},
	});

	globals.define("removeAt", {
		arity() {
			return 2;
		},
		call(_, args) {
			const list = args[0] as unknown[];
			const index = args[1] as number;

			if (Array.isArray(list) && typeof index === "number" && index >= 0) {
				return list.splice(index, 1)[0];
			}
			return undefined;
		},
	});
}
