import { Token } from "./Lexer";
import { Callable } from "./Callable";
import { RuntimeError } from "./RuntimeError";

export class Environment {
	readonly enclosing?: Environment;
	private values: Map<string, unknown> = new Map();

	constructor(enclosing?: Environment) {
		this.enclosing = enclosing;
	}

	define(name: string, value: Callable): void;
	define(name: string, value: unknown): void;
	define(name: string, value: unknown): void {
		this.values.set(name, value);
	}

	ancestor(distance: number): Environment {
		let environment = this as Environment;
		for (let i = 0; i < distance; i++) {
			environment = environment.enclosing!;
		}
		return environment;
	}

	get(name: string): unknown {
		if (this.values.has(name)) {
			return this.values.get(name);
		}
		if (this.enclosing) {
			return this.enclosing.get(name);
		}

		throw new RuntimeError(`Undefined variable '${name}'.`, 0);
	}

	getAt(distance: number, name: string): unknown {
		return this.ancestor(distance).values.get(name);
	}

	assign(name: Token, value: unknown): void {
		if (this.values.has(name.value)) {
			this.values.set(name.value, value);
			return;
		}
		if (this.enclosing) {
			this.enclosing.assign(name, value);
			return;
		}
		throw new RuntimeError(`Undefined variable '${name.value}'.`, name.line);
	}

	assignAt(distance: number, name: string, value: unknown): void {
		this.ancestor(distance).values.set(name, value);
	}
}
