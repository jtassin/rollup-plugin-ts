import * as TSModule from "typescript";
import {TypescriptPluginOptions} from "../../plugin/typescript-plugin-options";
import {getRealFileSystem} from "../file-system/file-system";
import {ensureAbsolute, normalize} from "../path/path-util";

/**
 * Gets normalized PluginOptions based on the given ones
 */
export function getPluginOptions(options: Partial<TypescriptPluginOptions>): TypescriptPluginOptions {
	// Destructure the options and provide defaults
	const {
		browserslist,
		transpiler = "typescript",
		typescript = TSModule,
		cwd = normalize(process.cwd()),
		tsconfig,
		transformers,
		include = [],
		exclude = [],
		transpileOnly = false,
		debug = false,
		fileSystem = getRealFileSystem(typescript),
		hook = {}
	} = options;

	// These options will be used no matter what
	const baseOptions = {
		typescript,
		browserslist,
		cwd: ensureAbsolute(process.cwd(), cwd),
		exclude,
		include,
		transformers,
		tsconfig,
		transpileOnly,
		debug,
		fileSystem,
		hook
	};

	// If we're to use Typescript, return the Typescript-options
	if (transpiler === "typescript") {
		return {
			...baseOptions,
			transpiler: "typescript"
		};
	} else {
		return {
			...baseOptions,
			...("babelConfig" in options ? {babelConfig: options.babelConfig} : {}),
			transpiler: "babel"
		};
	}
}
