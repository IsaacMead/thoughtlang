import { Lexer } from "./Lexer";
import { Parser } from "./Parser";
import Interpreter from "./Interpreter";
import { injectGlobals } from "./lib/InjectGlobals";

// Runs a script and returns every console.log call, snapshotted at call time
function run(source: string): string[] {
	const logs: string[] = [];
	const original = console.log;
	console.log = (...args: unknown[]) => {
		logs.push(JSON.stringify(args));
	};
	try {
		const interpreter = new Interpreter();
		injectGlobals(interpreter, interpreter.getGlobals());
		interpreter.interpret(new Parser(new Lexer(source).tokenize()).parse());
	} finally {
		console.log = original;
	}
	return logs;
}

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
	if (!ok) failures++;
	console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : " " + detail}`);
}

const p = (v: unknown) => JSON.stringify(["[ThoughtScript]", v]);

const source = [
	"function add(a: number, b: number) { return a + b; }",
	"print(add(2, 3));",
	"var list = [3, 1, 2, 10];",
	"function asc(a, b) { return a - b; }",
	"function desc(a, b) { return b - a; }",
	"sort(list, asc);",
	"print(list);",
	"sort(list, desc);",
	"print(list);",
	"list[0] = 99;",
	"print(list[0]);",
	"print(list[1]);",
	"print(length(list));",
	"push(list, 7);",
	"print(pop(list));",
	"print(removeAt(list, 0));",
	'var d = {"a": 1, "b": 2};',
	'print(d["b"]);',
	"var i = 0;",
	"while (i < 3) { i += 1; }",
	"print(i);",
	"var t = os_clock();",
	"wait(0.05);",
	"print(os_clock() - t >= 0.04);",
	'print("hello");',
	'print("n=" + 5);',
	"var sequence = 1;",
	"print(sequence);",
	"print(typeOf(list));",
].join("\n");

const expected = [
	p(5), // function call + typed params
	p([1, 2, 3, 10]), // sort: a - b is ascending
	p([10, 3, 2, 1]), // sort: b - a is descending
	p(99), // index set...
	p(3), // ...lands in the same slot index get reads
	p(4), // length
	p(7), // push + pop
	p(99), // removeAt
	p(2), // dict literal + string index
	p(3), // while + compound assignment
	p(true), // wait() actually sleeps
	p("hello"), // string literal slicing
	p("n=5"), // string concat
	p(1), // "sequence" is a plain identifier now
	p("object"), // typeOf uses JS type names
];

const actual = run(source);
expected.forEach((exp, i) => check(`program output ${i + 1}`, actual[i] === exp, `expected ${exp}, got ${actual[i]}`));
check("no extra output (no errors logged)", actual.length === expected.length, `got ${actual.length} log calls: ${actual.slice(expected.length).join(" | ")}`);

check(
	"type hint mismatch throws",
	run(`function add(a: number, b: number) { return a + b; } add("x", 1);`).some((l) => l.includes("Type Mismatch")),
);
check(
	"remember() is gone",
	run(`remember("a", 1);`).some((l) => l.includes("Undefined variable 'remember'")),
);

if (failures > 0) throw new Error(`${failures} check(s) failed`);
console.log("ALL PASSED");
