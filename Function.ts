import { Callable } from "./Callable";
import { FunctionStmt } from "./Parser";
import { Environment } from "./Environment";
import Interpreter from "./Interpreter";
import { Return, RuntimeError } from "./RuntimeError";

interface TypeObject extends Callable {
	typeName: string;
}

export default class Function implements Callable {
	constructor(
		private readonly declaration: FunctionStmt,
		private readonly closure: Environment,
	) {}

	arity(): number {
		return this.declaration.params.length;
	}

	call(interpreter: Interpreter, args: unknown[]): unknown {
		const environment = new Environment(this.closure);
		const globals = interpreter.getGlobals();

		for (let i = 0; i < this.declaration.params.length; i++) {
			const param = this.declaration.params[i];
			const argument = args[i];

			if (!param.typeHint) {
				environment.define(param.name.value, argument);
				continue;
			}

			const typeValue = globals.get(param.typeHint.value);

			if (typeof typeValue !== "object" || typeValue === null || !("typeName" in typeValue)) {
				environment.define(param.name.value, argument);
				continue;
			}

			const typeObject = typeValue as TypeObject;
			const actualType = typeof argument;

			if (typeObject.typeName !== actualType) {
				throw new RuntimeError(
					`Type Mismatch: Parameter '${param.name.value}' expects ${typeObject.typeName}, got ${actualType}.`,
					param.name.line,
				);
			}

			environment.define(param.name.value, argument);
		}

		try {
			interpreter.executeBlock(this.declaration.body, environment);
		} catch (e) {
			if (e instanceof Return) return e.value;
			throw e;
		}

		return undefined;
	}

	toString(): string {
		return `<fn ${this.declaration.name.value}>`;
	}
}
