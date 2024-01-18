/**
 * Extracts Svelte component tags from the HTML content and generates import statements.
 * @param htmlContent - The HTML content from which to extract Svelte component tags.
 * @returns A string containing import statements for the Svelte components found in the HTML content.
 */
function extractAndGenerateImports(htmlContent: string): string {
  const componentTagRegex = /<([A-Z]\w+).*?\/>/g;
  const uniqueComponentNames = new Set<string>();

  let match;
  while ((match = componentTagRegex.exec(htmlContent)) !== null) {
    uniqueComponentNames.add(match[1]);
  }

  return Array.from(uniqueComponentNames)
    .map(componentName => `import ${componentName} from './${componentName}.svelte';`)
    .join('\n');
}

/**
 * Creates a Svelte file content by wrapping the provided HTML content with necessary Svelte structure.
 * @param htmlContent - The HTML content to be included in the Svelte file.
 * @returns A string representing the complete content of a Svelte file.
 */
export function createSvelteFileContent(htmlContent: string): string {
  const importStatements = extractAndGenerateImports(htmlContent);
  return `<script>\n${importStatements}\n</script>\n${htmlContent}`;
}
