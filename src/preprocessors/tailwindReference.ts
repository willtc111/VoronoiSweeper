import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function tailwindReference(cssPath = path.resolve(__dirname, "src/routes/layout.css")) {
	return {
		name: "tailwind-reference",
		style({
			content,
			attributes,
		}: {
			content: string;
			attributes: Record<string, string | boolean>;
		}) {
			if (content.includes("@reference") || (attributes.lang && attributes.lang !== "css")) {
				return { code: content };
			}

			// Normalize backslashes to forward slashes for CSS compatibility
			const normalizedPath = cssPath.replace(/\\/g, "/");

			return {
				code: `@reference "${normalizedPath}";\n${content}`,
			};
		},
	};
}
