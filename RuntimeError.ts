export class RuntimeError {
	constructor(
		public message: string,
		public line: number,
	) {}
}

export class Return {
	constructor(public readonly value: unknown) {}
}
