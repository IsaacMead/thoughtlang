import { Token, TokenType } from "./Lexer";

type TokenValues = string | number | boolean | undefined;

// Visitor interfaces
export interface ExprVisitor<R> {
	visitBinaryExpr(expr: BinaryExpr): R;
	visitUnaryExpr(expr: UnaryExpr): R;
	visitLiteralExpr(expr: LiteralExpr): R;
	visitGroupingExpr(expr: GroupingExpr): R;
	visitVariableExpr(expr: VariableExpr): R;
	visitAssignmentExpr(expr: AssignmentExpr): R;
	visitCallExpr(expr: CallExpr): R;
	visitLogicalExpr(expr: LogicalExpr): R;
	visitDictExpr(expr: DictExpr): R;
	visitIndexExpr(expr: IndexExpr): R;
	visitArrayExpr(expr: ArrayExpr): R;
	visitSetIndexExpr(expr: SetIndexExpr): R;
}

export interface StmtVisitor<R> {
	visitExpressionStmt(stmt: ExpressionStmt): R;
	visitBlockStmt(stmt: BlockStmt): R;
	visitIfStmt(stmt: IfStmt): R;
	visitFunctionStmt(stmt: FunctionStmt): R;
	visitReturnStmt(stmt: ReturnStmt): R;
	visitWhileStmt(stmt: WhileStmt): R;
}

export abstract class Expr {
	abstract accept<R>(visitor: ExprVisitor<R>): R;
	constructor(public line: number) {}
}

export abstract class Stmt {
	abstract accept<R>(visitor: StmtVisitor<R>): R;
	constructor(public line: number) {}
}

export class SetIndexExpr extends Expr {
	constructor(
		public object: Expr, // The array or dict
		public index: Expr, // The key or index
		public value: Expr, // The new value to set
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		// You'll need to add this method to your ExprVisitor interface
		return visitor.visitSetIndexExpr(this);
	}
}

export class WhileStmt extends Stmt {
	constructor(
		public condition: Expr,
		public body: Stmt,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitWhileStmt(this);
	}
}

export class BinaryExpr extends Expr {
	constructor(
		public left: Expr,
		public operator: Token,
		public right: Expr,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitBinaryExpr(this);
	}
}

export class UnaryExpr extends Expr {
	constructor(
		public operator: Token,
		public right: Expr,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitUnaryExpr(this);
	}
}

export class LiteralExpr extends Expr {
	constructor(
		public value: string | number | boolean | undefined,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitLiteralExpr(this);
	}
}

export class GroupingExpr extends Expr {
	constructor(
		public expression: Expr,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitGroupingExpr(this);
	}
}

export class VariableExpr extends Expr {
	constructor(
		public name: Token,
		line: number,
		public typeHint?: Token, // Store hint if it was declared here
	) {
		super(line);
	}
	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitVariableExpr(this);
	}
}

export class AssignmentExpr extends Expr {
	constructor(
		public name: Token,
		public value: Expr,
		line: number,
		public typeHint?: Token, // Store hint for declarations
	) {
		super(line);
	}
	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitAssignmentExpr(this);
	}
}

export interface TypedParam {
	name: Token;
	typeHint?: Token;
}
export class CallExpr extends Expr {
	constructor(
		public callee: Expr,
		public args: Expr[],
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitCallExpr(this);
	}
}

export class ArrayExpr extends Expr {
	constructor(
		public elements: Expr[],
		line: number,
	) {
		super(line);
	}
	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitArrayExpr(this);
	}
}
export class DictExpr extends Expr {
	// Storing as pairs of [Expression, Expression] to allow dynamic keys if desired
	constructor(
		public entries: [Expr, Expr][],
		line: number,
	) {
		super(line);
	}
	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitDictExpr(this);
	}
}

export class IndexExpr extends Expr {
	constructor(
		public object: Expr,
		public index: Expr,
		line: number,
	) {
		super(line);
	}
	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitIndexExpr(this);
	}
}

// Statement classes
export class ExpressionStmt extends Stmt {
	constructor(
		public expression: Expr,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitExpressionStmt(this);
	}
}

export class BlockStmt extends Stmt {
	constructor(
		public statements: Stmt[],
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitBlockStmt(this);
	}
}

export class IfStmt extends Stmt {
	constructor(
		public condition: Expr,
		public thenBranch: Stmt,
		public elseBranch: Stmt | undefined,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitIfStmt(this);
	}
}

export class FunctionStmt extends Stmt {
	constructor(
		public name: Token,
		public params: TypedParam[], // Updated from Token[]
		public body: Stmt[],
		line: number,
	) {
		super(line);
	}
	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitFunctionStmt(this);
	}
}

export class ReturnStmt extends Stmt {
	constructor(
		public value: Expr | undefined,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitReturnStmt(this);
	}
}

export class LogicalExpr extends Expr {
	constructor(
		public left: Expr,
		public operator: Token,
		public right: Expr,
		line: number,
	) {
		super(line);
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitLogicalExpr(this);
	}
}

class ParseError {
	constructor(
		public readonly message: string,
		public readonly token: Token,
	) {}
}

export class Parser {
	private tokens: Token[] = [];
	private current: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	public parse(): Stmt[] {
		const statements: Stmt[] = [];
		while (!this.isAtEnd()) {
			const decl = this.declaration();
			if (decl) statements.push(decl);
		}
		return statements;
	}
	private declaration(): Stmt {
		try {
			if (this.match(TokenType.Function)) return this.functionDeclaration("function");

			return this.statement();
		} catch (error) {
			this.synchronize();
			console.warn(error);
			return undefined!;
		}
	}

	private functionDeclaration(kind: string): FunctionStmt {
		const name = this.consume(TokenType.Identifier, `Expect ${kind} name.`);
		this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name.`);

		const parameters: TypedParam[] = [];
		if (!this.check(TokenType.RightParen)) {
			do {
				const paramName = this.consume(TokenType.Identifier, "Expect parameter name.");
				let typeHint: Token | undefined;

				if (this.match(TokenType.Colon)) {
					typeHint = this.consume(TokenType.Identifier, "Expect type name.");
				}

				parameters.push({ name: paramName, typeHint });
			} while (this.match(TokenType.Comma));
		}

		this.consume(TokenType.RightParen, "Expect ')' after parameters.");
		this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body.`);
		const body = this.blockStatement().statements;

		return new FunctionStmt(name, parameters, body, name.line);
	}

	private peek(): Token {
		return this.tokens[this.current];
	}

	private previous(): Token {
		return this.tokens[this.current - 1];
	}

	private isAtEnd(): boolean {
		return this.peek().tokenType === TokenType.EOF;
	}

	private advance(): Token {
		if (!this.isAtEnd()) this.current++;
		return this.previous();
	}

	private check(tokenType: TokenType): boolean {
		if (this.isAtEnd()) return false;
		return this.peek().tokenType === tokenType;
	}

	private match(...tokenTypes: TokenType[]): boolean {
		for (const tokenType of tokenTypes) {
			if (this.check(tokenType)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private consume(tokenType: TokenType, message: string): Token {
		if (this.check(tokenType)) return this.advance();
		throw this.error(this.peek(), message);
	}

	private error(token: Token, message: string): ParseError {
		const location = token.tokenType === TokenType.EOF ? "at end" : `at '${token.value}'`;
		console.warn(`[Line ${token.line}] Error ${location}: ${message}`);
		return new ParseError(message, token);
	}

	private synchronize(): void {
		this.advance();

		while (!this.isAtEnd()) {
			if (this.previous().tokenType === TokenType.Semicolon) return;

			switch (this.peek().tokenType) {
				case TokenType.If:
					return;
			}

			this.advance();
		}
	}
	private statement(): Stmt {
		if (this.match(TokenType.If)) return this.ifStatement();
		if (this.match(TokenType.While)) return this.whileStatement();
		if (this.match(TokenType.LeftBrace)) return this.blockStatement();
		if (this.match(TokenType.Return)) return this.returnStatement();
		return this.expressionStatement();
	}
	private returnStatement(): Stmt {
		const keyword = this.previous();
		let value: Expr | undefined;

		if (!this.check(TokenType.Semicolon)) {
			value = this.expression();
		}

		this.consume(TokenType.Semicolon, "Expect ';' after return value.");

		return new ReturnStmt(value, keyword.line);
	}

	private whileStatement(): Stmt {
		this.consume(TokenType.LeftParen, "Expect '(' after 'while'.");
		const condition = this.expression();
		this.consume(TokenType.RightParen, "Expect ')' after while condition.");

		// We parse a single statement, which could be a BlockStmt ({ ... })
		const body = this.statement();

		return new WhileStmt(condition, body, this.previous().line);
	}

	private blockStatement(): BlockStmt {
		const statements: Stmt[] = [];
		while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
			// MUST be declaration() so 'var' works inside loops!
			statements.push(this.declaration());
		}
		this.consume(TokenType.RightBrace, "Expect '}' after block.");
		return new BlockStmt(statements, this.previous().line);
	}
	private expressionStatement(): ExpressionStmt {
		const expr = this.expression();
		this.consume(TokenType.Semicolon, "Expect ';' after expression.");
		return new ExpressionStmt(expr, this.previous().line);
	}

	private primary(): Expr {
		// Match literals that have a pre-processed .literal value
		if (this.match(TokenType.False, TokenType.True, TokenType.Number, TokenType.String)) {
			return new LiteralExpr(this.previous().literal as TokenValues, this.previous().line);
		}

		// Array Literal: [expr, expr, ...]
		if (this.match(TokenType.LeftSquareParen)) {
			const elements: Expr[] = [];
			if (!this.check(TokenType.RightSquareParen)) {
				do {
					elements.push(this.expression());
				} while (this.match(TokenType.Comma));
			}
			this.consume(TokenType.RightSquareParen, "Expect ']' after array elements.");
			return new ArrayExpr(elements, this.previous().line);
		}

		// Dictionary Literal: { expr: expr, ... }
		if (this.match(TokenType.LeftBrace)) {
			const entries: [Expr, Expr][] = [];
			if (!this.check(TokenType.RightBrace)) {
				do {
					const key = this.expression();
					this.consume(TokenType.Colon, "Expect ':' after dictionary key.");
					const value = this.expression();
					entries.push([key, value]);
				} while (this.match(TokenType.Comma));
			}
			this.consume(TokenType.RightBrace, "Expect '}' after dictionary entries.");
			return new DictExpr(entries, this.previous().line);
		}

		if (this.match(TokenType.Identifier)) {
			const name = this.previous();
			return new VariableExpr(name, name.line);
		}

		if (this.match(TokenType.LeftParen)) {
			const expr = this.expression();
			this.consume(TokenType.RightParen, "Expect ')' after expression.");
			return new GroupingExpr(expr, this.previous().line);
		}

		throw this.error(this.peek(), "Expect expression.");
	}

	private unary(): Expr {
		if (this.match(TokenType.Bang, TokenType.Minus)) {
			const operator = this.previous();
			const right = this.unary();
			return new UnaryExpr(operator, right, operator.line);
		}
		return this.call();
	}

	private call(): Expr {
		let expr = this.primary();

		while (true) {
			if (this.match(TokenType.LeftParen)) {
				expr = this.finishCall(expr);
			} else if (this.match(TokenType.LeftSquareParen)) {
				// <--- Added for Indexing
				const index = this.expression();
				this.consume(TokenType.RightSquareParen, "Expect ']' after index.");
				expr = new IndexExpr(expr, index, this.previous().line);
			} else {
				break;
			}
		}

		return expr;
	}
	private finishCall(callee: Expr): Expr {
		const args: Expr[] = [];
		if (!this.check(TokenType.RightParen)) {
			do {
				if (args.length >= 255) {
					this.error(this.peek(), "Can't have more than 255 arguments.");
				}
				args.push(this.expression());
			} while (this.match(TokenType.Comma));
		}

		const paren = this.consume(TokenType.RightParen, "Expect ')' after arguments.");
		return new CallExpr(callee, args, paren.line);
	}
	private factor(): Expr {
		let expr = this.unary();
		while (this.match(TokenType.Star, TokenType.Slash, TokenType.Modulo)) {
			const operator = this.previous();
			const right = this.unary();
			expr = new BinaryExpr(expr, operator, right, operator.line);
		}
		return expr;
	}
	private term(): Expr {
		let expr = this.factor();
		while (this.match(TokenType.Plus, TokenType.Minus)) {
			const operator = this.previous();
			const right = this.factor();
			expr = new BinaryExpr(expr, operator, right, operator.line);
		}
		return expr;
	}
	private comparison(): Expr {
		let expr = this.term();
		while (this.match(TokenType.Greater, TokenType.GreaterEqual, TokenType.Less, TokenType.LessEqual)) {
			const operator = this.previous();
			const right = this.term();
			expr = new BinaryExpr(expr, operator, right, operator.line);
		}
		return expr;
	}
	private equality(): Expr {
		let expr = this.comparison();
		while (this.match(TokenType.EqualEqual, TokenType.BangEqual)) {
			const operator = this.previous();
			const right = this.comparison();
			expr = new BinaryExpr(expr, operator, right, operator.line);
		}
		return expr;
	}

	private expression(): Expr {
		return this.assignment();
	}

	private assignment(): Expr {
		// Handle variable declarations: var x = ...
		if (this.match(TokenType.Var)) {
			const name = this.consume(TokenType.Identifier, "Expect variable name.");
			let typeHint: Token | undefined;
			if (this.match(TokenType.Colon)) {
				typeHint = this.consume(TokenType.Identifier, "Expect type name.");
			}
			this.consume(TokenType.Equal, "Expect '=' for variable initialization.");
			const value = this.assignment();
			return new AssignmentExpr(name, value, name.line, typeHint);
		}

		// Parse the left-hand side (could be a variable or an index expression)
		const expr = this.or();

		if (
			this.match(TokenType.Equal, TokenType.PlusEqual, TokenType.MinusEqual, TokenType.StarEqual, TokenType.SlashEqual)
		) {
			const operator = this.previous();
			const value = this.assignment();

			// 1. Variable Assignment: name = value
			if (expr instanceof VariableExpr) {
				let finalValue = value;

				// Desugar compound assignment: x += 5 => x = x + 5
				if (operator.tokenType !== TokenType.Equal) {
					const baseOpType = this.getBinaryOpForCompound(operator.tokenType);
					const dummyOpToken: Token = {
						tokenType: baseOpType,
						value: operator.value.charAt(0),
						line: operator.line,
					};
					finalValue = new BinaryExpr(expr, dummyOpToken, value, operator.line);
				}

				return new AssignmentExpr(expr.name, finalValue, operator.line);
			}

			// 2. Index Assignment: object[index] = value
			else if (expr instanceof IndexExpr) {
				let finalValue = value;

				// Desugar compound for index: list[0] += 5 => list[0] = list[0] + 5
				if (operator.tokenType !== TokenType.Equal) {
					const baseOpType = this.getBinaryOpForCompound(operator.tokenType);
					const dummyOpToken: Token = {
						tokenType: baseOpType,
						value: operator.value.charAt(0),
						line: operator.line,
					};
					finalValue = new BinaryExpr(expr, dummyOpToken, value, operator.line);
				}

				return new SetIndexExpr(expr.object, expr.index, finalValue, operator.line);
			}

			throw this.error(operator, "Invalid assignment target.");
		}

		return expr;
	}
	private getBinaryOpForCompound(tokenType: TokenType): TokenType {
		switch (tokenType) {
			case TokenType.PlusEqual:
				return TokenType.Plus;
			case TokenType.MinusEqual:
				return TokenType.Minus;
			case TokenType.StarEqual:
				return TokenType.Star;
			case TokenType.SlashEqual:
				return TokenType.Slash;
			default:
				return TokenType.Equal;
		}
	}
	private or(): Expr {
		let expr = this.and();
		while (this.match(TokenType.Or)) {
			// Matches '||'
			const operator = this.previous();
			const right = this.and();
			expr = new LogicalExpr(expr, operator, right, operator.line);
		}
		return expr;
	}

	private and(): Expr {
		let expr = this.equality();
		while (this.match(TokenType.And)) {
			// Matches '&&'
			const operator = this.previous();
			const right = this.equality();
			expr = new LogicalExpr(expr, operator, right, operator.line);
		}
		return expr;
	}
	private peekNext(): Token | undefined {
		if (this.current + 1 >= this.tokens.length) return undefined;
		return this.tokens[this.current + 1];
	}
	private ifStatement(): IfStmt {
		this.consume(TokenType.LeftParen, "Expect '(' after 'if'.");
		const condition = this.expression();
		this.consume(TokenType.RightParen, "Expect ')' after if condition.");

		const thenBranch = this.statement();
		let elseBranch: Stmt | undefined;
		if (this.match(TokenType.Else)) {
			elseBranch = this.statement();
		}

		return new IfStmt(condition, thenBranch, elseBranch, this.previous().line);
	}
}
