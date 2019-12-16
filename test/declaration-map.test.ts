import test from "ava";
import {formatCode} from "./util/format-code";
import {generateRollupBundle} from "./setup/setup-rollup";
// tslint:disable:no-duplicate-string

test("Declaration maps correctly maps input sources. #1", async t => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "src/index.ts",
				text: `\
					import {Foo, Bar} from "./foo";
					export {Foo};
					export {Bar};
					`
			},
			{
				entry: false,
				fileName: "src/foo.ts",
				text: `\
					export const Foo = "Hello, World!";
					export const Bar = 2;
					`
			}
		],
		{
			debug: true,
			dir: "dist",
			tsconfig: {declarationMap: true}
		}
	);
	const {
		declarationMaps: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code, "json"),
		formatCode(
			`\
		{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../src/index.ts", "../src/foo.ts"],"names":[],"mappings":";;AACK,OAAO,YAAK,CAAC"}
		`,
			"json"
		)
	);
});

test("Declaration maps correctly maps input sources. #2", async t => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					import {Foo} from "./foo";
					export {Foo}
					`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
					export type Foo = string;
					`
			}
		],
		{
			debug: true,
			tsconfig: {declarationMap: true, declarationDir: "./foobarbaz"}
		}
	);
	const {
		declarationMaps: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code, "json"),
		formatCode(
			`\
		{"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../index.ts","../foo.ts"],"names":[],"mappings":";AACK,OAAO,OAAK,CAAA"}
		`,
			"json"
		)
	);
});

test("Declaration maps respect rewritten output paths. #1", async t => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					import {Foo} from "./foo";
					export {Foo}
					`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
					export type Foo = string;
					`
			}
		],
		{
			debug: true,
			tsconfig: {
				declarationMap: true,
				declarationDir: "./foobarbaz"
			},
			hook: {
				outputPath: path => path.replace("index.d.ts", "index-rewritten.d.ts")
			}
		}
	);
	const {
		declarationMaps: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code, "json"),
		formatCode(
			`\
		{"version":3,"file":"index-rewritten.d.ts","sourceRoot":"","sources":["../index.ts","../foo.ts"],"names":[],"mappings": ";AACK,OAAO,OAAK,CAAA"}
		`,
			"json"
		)
	);
});

test("Declaration maps respect rewritten output paths. #2", async t => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export * from "./foo";
					`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
					export * from "./bar";
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					export * from "./bar";
					export {SyntaxKind as Foo} from "typescript";
					`
			}
		],
		{
			debug: true,
			tsconfig: {
				declarationMap: true
			},
			hook: {
				outputPath: (path, kind) => {
					if (kind === "declaration") return path.replace("index.d.ts", "nested/dir/index-rewritten.d.ts");
					return path.replace("index.d.ts", "index-rewritten.d.ts");
				}
			}
		}
	);
	const {
		declarations: [file],
		declarationMaps: [mapFile]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		export { SyntaxKind as Foo } from "typescript";
		//# sourceMappingURL=index-rewritten.d.ts.map
		`)
	);

	t.deepEqual(
		formatCode(mapFile.code, "json"),
		formatCode(
			`\
		{"version":3,"file":"index-rewritten.d.ts","sourceRoot":"","sources":["../../index.ts","../../bar.ts","../../foo.ts"],"names":[],"mappings": ""}
		`,
			"json"
		)
	);
});
