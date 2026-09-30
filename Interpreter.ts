import { Environment } from "./Environment";
import { Return, RuntimeError } from "./RuntimeError";

import {
	ExprVisitor,
	StmtVisitor,
	LiteralExpr,
	AssignmentExpr,
	Expr,
	BinaryExpr,
	BlockStmt,
	Stmt,
	ExpressionStmt,
	UnaryExpr,
	VariableExpr,
	CallExpr,
	GroupingExpr,
	IfStmt,
	FunctionStmt,
	ReturnStmt,
	LogicalExpr,
	WhileStmt,
	DictExpr,
	IndexExpr,
	ArrayExpr,
	SetIndexExpr,
} from "./Parser";
import { Callable } from "./Callable";
import Function from "./Function";

// const TYPE_NUMBER = { name: "number" };
// const TYPE_STRING = { name: "string" };
// const TYPE_BOOL = { name: "boolean" };
// const TYPE_FUNC = { name: "function" };
// const TYPE_NIL = { name: "nil" };

class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
	constructor() {}

	public interpret(statements: Stmt[]): void {
		try {
			for (const statement of statements) {
				this.execute(statement);
			}
		} catch (error) {
			console.log("An error occurred during interpretation.", error);
			if (error instanceof RuntimeError) {
				console.log(`Runtime error: ${error.message} at line ${error.line}`);
			}
		}
	}

	public getGlobals(): Environment {
		return this.globals;
	}

	private readonly locals = new Map<Expr, number>();
	private globals = new Environment();

	private evaluate(expr: Expr): unknown {
		return expr.accept(this);
	}

	private isTruthy(value: unknown): boolean {
		if (value === undefined || value === null) return false;
		if (typeof value === "boolean") return value;
		return true;
	}

	private isEqual(a: unknown, b: unknown): boolean {
		return a === b;
	}

	private stringify(value: unknown): string {
		if (value === undefined) return "undefined";
		return String(value);
	}

	private checkNumberOperand(operator: { line: number; value: string }, operand: unknown): void {
		if (typeof operand === "number") return;
		throw new RuntimeError(`Operand must be a number at '${operator.value}'.`, operator.line);
	}

	private checkNumberOperands(operator: { line: number; value: string }, left: unknown, right: unknown): void {
		if (typeof left === "number" && typeof right === "number") return;
		throw new RuntimeError(`Operands must be numbers at '${operator.value}'.`, operator.line);
	}

	private execute(stmt: Stmt): void {
		stmt.accept(this);
	}

	executeBlock(statements: Stmt[], environment: Environment): void {
		const previous = this.globals;
		try {
			this.globals = environment;
			for (const statement of statements) {
				this.execute(statement);
			}
		} finally {
			this.globals = previous;
		}
	}

	visitArrayExpr(expr: ArrayExpr): unknown {
		return expr.elements.map((element) => this.evaluate(element));
	}

	visitDictExpr(expr: DictExpr): unknown {
		const result: Record<string, unknown> = {};
		for (const [keyExpr, valueExpr] of expr.entries) {
			const key = this.evaluate(keyExpr);
			const value = this.evaluate(valueExpr);
			if (typeof key === "string" || typeof key === "number") {
				result[String(key)] = value;
			}
		}
		return result;
	}

	visitIndexExpr(expr: IndexExpr): unknown {
		const object = this.evaluate(expr.object);
		const index = this.evaluate(expr.index);

		if (typeof object === "object" && object !== null) {
			let result: unknown;
			if (typeof index === "number") {
				result = (object as unknown[])[index];
			} else if (typeof index === "string") {
				result = (object as Record<string, unknown>)[index];
			}
			return result;
		}

		throw new RuntimeError("Target is not indexable.", expr.line);
	}

	visitSetIndexExpr(expr: SetIndexExpr): unknown {
		const object = this.evaluate(expr.object);
		const index = this.evaluate(expr.index);
		const value = this.evaluate(expr.value);

		if (typeof object === "object" && object !== null) {
			if (typeof index === "number") {
				(object as unknown[])[index] = value;
			} else if (typeof index === "string") {
				(object as Record<string, unknown>)[index] = value;
			}
			return value;
		}

		throw new RuntimeError("Target is not indexable.", expr.line);
	}

	visitLiteralExpr(expr: LiteralExpr): unknown {
		return expr.value;
	}

	visitAssignmentExpr(expr: AssignmentExpr): unknown {
		const value = this.evaluate(expr.value);
		const distance = this.locals.get(expr);
		if (distance !== undefined) {
			this.globals.assignAt(distance, expr.name.value, value);
		} else {
			try {
				this.globals.assign(expr.name, value);
			} catch {
				this.globals.define(expr.name.value, value);
			}
		}
		return value;
	}

	public visitWhileStmt(stmt: WhileStmt): void {
		while (this.evaluate(stmt.condition)) {
			this.execute(stmt.body);
		}
	}

	visitBinaryExpr(expr: BinaryExpr): unknown {
		const left = this.evaluate(expr.left);
		const right = this.evaluate(expr.right);

		switch (expr.operator.value) {
			case "+":
				// If either side is a string, force concatenation
				if (typeof left === "string" || typeof right === "string") {
					return String(left) + String(right);
				}

				// If both are numbers, do actual math
				if (typeof left === "number" && typeof right === "number") {
					return left + right;
				}

				throw new RuntimeError("Operands must be two numbers or two strings.", expr.operator.line);
			case "-":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) - (right as number);

			case "*":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) * (right as number);

			case "/":
				this.checkNumberOperands(expr.operator, left, right);
				if ((right as number) === 0) {
					throw new RuntimeError(`Division by zero.`, expr.operator.line);
				}
				return (left as number) / (right as number);

			case "%":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) % (right as number);

			case "==":
				return this.isEqual(left, right);

			case "!=":
				return !this.isEqual(left, right);

			case "<":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) < (right as number);

			case "<=":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) <= (right as number);

			case ">":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) > (right as number);

			case ">=":
				this.checkNumberOperands(expr.operator, left, right);
				return (left as number) >= (right as number);
		}

		throw new RuntimeError(`Unknown operator '${expr.operator.value}'.`, expr.operator.line);
	}

	visitBlockStmt(stmt: BlockStmt): void {
		const environment = new Environment(this.globals);
		this.executeBlock(stmt.statements, environment);
	}

	visitExpressionStmt(stmt: ExpressionStmt): void {
		this.evaluate(stmt.expression);
	}

	visitUnaryExpr(expr: UnaryExpr): unknown {
		const right = this.evaluate(expr.right);
		switch (expr.operator.value) {
			case "-":
				this.checkNumberOperand(expr.operator, right);
				return -(right as number);
			case "!":
				return !this.isTruthy(right);
		}
		throw new RuntimeError(`Unknown operator '${expr.operator.value}'.`, expr.operator.line);
	}

	visitVariableExpr(expr: VariableExpr): unknown {
		const distance = this.locals.get(expr);
		if (distance !== undefined) {
			return this.globals.getAt(distance, expr.name.value);
		} else {
			return this.globals.get(expr.name.value);
		}
	}

	visitGroupingExpr(expr: GroupingExpr): unknown {
		return this.evaluate(expr.expression);
	}

	visitCallExpr(expr: CallExpr): unknown {
		const callee = this.evaluate(expr.callee);

		const args = expr.args.map((arg) => this.evaluate(arg));

		if (!this.isCallable(callee)) {
			throw new RuntimeError(`Can only call functions and classes.`, expr.line);
		}

		if (args.length !== callee.arity()) {
			throw new RuntimeError(`Expected ${callee.arity()} arguments but got ${args.length}.`, expr.line);
		}

		return callee.call(this, args);
	}

	private isCallable(value: unknown): value is Callable {
		return typeof value === "object" && value !== null && typeof (value as Callable).call === "function";
	}

	visitIfStmt(stmt: IfStmt): void {
		if (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.thenBranch);
		} else if (stmt.elseBranch) {
			this.execute(stmt.elseBranch);
		}
	}

	visitFunctionStmt(stmt: FunctionStmt): void {
		const func = new Function(stmt, this.globals);

		this.globals.define(stmt.name.value, func);
	}

	visitReturnStmt(stmt: ReturnStmt): void {
		let value: unknown = undefined;
		if (stmt.value !== undefined) {
			value = this.evaluate(stmt.value);
		}

		throw new Return(value);
	}

	visitLogicalExpr(expr: LogicalExpr): unknown {
		const left = this.evaluate(expr.left);

		if (expr.operator.value === "or") {
			if (this.isTruthy(left)) return left;
		} else {
			if (!this.isTruthy(left)) return left;
		}

		return this.evaluate(expr.right);
	}

	public getVariable(name: string): unknown {
		return this.globals.get(name);
	}
}

export default Interpreter;
