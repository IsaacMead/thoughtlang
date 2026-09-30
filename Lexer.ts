export enum TokenType {
	// Single-character tokens
	LeftParen,
	RightParen,
	LeftBrace,
	RightBrace,
	Comma,
	Dot,
	Minus,
	Plus,
	Semicolon,
	Slash,
	Star,
	Colon,
	Modulo,
	LeftSquareParen,
	RightSquareParen,

	// One or two character tokens
	Bang,
	BangEqual,
	Equal,
	EqualEqual,
	Greater,
	GreaterEqual,
	Less,
	LessEqual,

	// Logical
	And,
	Or,

	// Assignment variants
	PlusEqual,
	MinusEqual,
	StarEqual,
	SlashEqual,

	// Literals
	Identifier,
	String,
	Number,

	// Keywords
	If,
	Else,
	True,
	False,
	Function,
	Return,
	Var,
	While,

	EOF,
}

export interface Token {
	tokenType: TokenType;
	value: string; // The raw text (lexeme)
	literal?: unknown; // The parsed value (number, string, boolean)
	line: number;
}

const KEYWORDS = new Map<string, TokenType>([
	["if", TokenType.If],
	["else", TokenType.Else],
	["true", TokenType.True],
	["false", TokenType.False],
	["function", TokenType.Function],
	["return", TokenType.Return],
	["var", TokenType.Var],
	["while", TokenType.While],
]);

export class Lexer {
	private cursor: number = 0;
	private start: number = 0;
	private line: number = 1;
	private tokens: Token[] = [];

	constructor(private input: string) {}

	public tokenize(): Token[] {
		while (!this.isAtEnd()) {
			this.start = this.cursor;
			this.scanToken();
		}

		this.tokens.push({ tokenType: TokenType.EOF, value: "", line: this.line });
		return this.tokens;
	}

	private scanToken() {
		const char = this.advance();

		switch (char) {
			case "(":
				this.addToken(TokenType.LeftParen);
				break;
			case ")":
				this.addToken(TokenType.RightParen);
				break;
			case "{":
				this.addToken(TokenType.LeftBrace);
				break;
			case "}":
				this.addToken(TokenType.RightBrace);
				break;
			case ",":
				this.addToken(TokenType.Comma);
				break;
			case ".":
				this.addToken(TokenType.Dot);
				break;
			case ";":
				this.addToken(TokenType.Semicolon);
				break;
			case ":":
				this.addToken(TokenType.Colon);
				break;
			case "%":
				this.addToken(TokenType.Modulo);
				break;

			case "-":
				this.addToken(this.match("=") ? TokenType.MinusEqual : TokenType.Minus);
				break;
			case "+":
				this.addToken(this.match("=") ? TokenType.PlusEqual : TokenType.Plus);
				break;
			case "*":
				this.addToken(this.match("=") ? TokenType.StarEqual : TokenType.Star);
				break;
			case "/":
				if (this.match("/")) {
					while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
				} else {
					this.addToken(this.match("=") ? TokenType.SlashEqual : TokenType.Slash);
				}
				break;

			case "!":
				this.addToken(this.match("=") ? TokenType.BangEqual : TokenType.Bang);
				break;
			case "=":
				this.addToken(this.match("=") ? TokenType.EqualEqual : TokenType.Equal);
				break;
			case "<":
				this.addToken(this.match("=") ? TokenType.LessEqual : TokenType.Less);
				break;
			case ">":
				this.addToken(this.match("=") ? TokenType.GreaterEqual : TokenType.Greater);
				break;

			case "&":
				if (this.match("&")) this.addToken(TokenType.And);
				break;
			case "|":
				if (this.match("|")) this.addToken(TokenType.Or);
				break;
			case "[":
				this.addToken(TokenType.LeftSquareParen);
				break;
			case "]":
				this.addToken(TokenType.RightSquareParen);
				break;

			case " ":
			case "\r":
			case "\t":
				break;
			case "\n":
				this.line++;
				break;

			case '"':
			case "'":
				this.readString(char);
				break;

			default:
				if (this.isDigit(char)) {
					this.readNumber();
				} else if (this.isAlpha(char)) {
					this.readIdentifier();
				} else {
					console.warn(`[Lexer] Unexpected character '${char}' at line ${this.line}`);
				}
				break;
		}
	}

	private isAtEnd(): boolean {
		return this.cursor >= this.input.length;
	}

	private advance(): string {
		return this.input.charAt(this.cursor++);
	}

	private peek(): string {
		if (this.isAtEnd()) return "\0";
		return this.input.charAt(this.cursor);
	}

	private peekNext(): string {
		if (this.cursor + 1 >= this.input.length) return "\0";
		return this.input.charAt(this.cursor + 1);
	}

	private match(expected: string): boolean {
		if (this.isAtEnd() || this.input.charAt(this.cursor) !== expected) return false;
		this.cursor++;
		return true;
	}

	private addToken(tokenType: TokenType, literal?: unknown) {
		const text = this.input.slice(this.start, this.cursor);
		this.tokens.push({ tokenType, value: text, literal, line: this.line });
	}

	private readNumber() {
		while (this.isDigit(this.peek())) this.advance();
		if (this.peek() === "." && this.isDigit(this.peekNext())) {
			this.advance();
			while (this.isDigit(this.peek())) this.advance();
		}

		const text = this.input.slice(this.start, this.cursor);
		this.addToken(TokenType.Number, Number(text));
	}

	private readString(quote: string) {
		while (this.peek() !== quote && !this.isAtEnd()) {
			if (this.peek() === "\n") this.line++;
			this.advance();
		}

		if (this.isAtEnd()) {
			console.warn(`[Lexer] Unterminated string at line ${this.line}`);
			return;
		}

		this.advance(); // The closing quote
		const literalValue = this.input.slice(this.start + 1, this.cursor - 1);
		this.addToken(TokenType.String, literalValue);
	}

	private readIdentifier() {
		while (this.isAlphaNumeric(this.peek())) this.advance();
		const text = this.input.slice(this.start, this.cursor);
		const tokenType = KEYWORDS.get(text) ?? TokenType.Identifier;

		// Process boolean literals directly in the lexer
		let literal: unknown = undefined;
		if (tokenType === TokenType.True) literal = true;
		if (tokenType === TokenType.False) literal = false;

		this.addToken(tokenType, literal);
	}

	private isAlpha(char: string): boolean {
		return /[A-Za-z_]/.test(char);
	}

	private isDigit(char: string): boolean {
		return /[0-9]/.test(char);
	}

	private isAlphaNumeric(char: string): boolean {
		return this.isAlpha(char) || this.isDigit(char);
	}
}
