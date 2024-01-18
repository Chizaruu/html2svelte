/**
 * Generates Svelte import statements from the HTML content.
 * It looks for self-closing component tags in the HTML and creates corresponding import statements.
 * @param htmlContent - The HTML content from which to extract component tags.
 * @returns A string containing import statements for the Svelte components found in the HTML content.
 */
function generateImportStatements(htmlContent: string) {
    const componentTags = htmlContent.match(/<[A-Z].* \/>/g) ?? [];
    return componentTags
      .map((tag: string | any[]) => `import ${tag.slice(1, -3)} from './${tag.slice(1, -3)}.svelte';`)
      .join('\n');
}

/**
 * Constructs a final Svelte file from the provided HTML content.
 * It wraps the HTML content with a script tag (containing import statements) and a style tag.
 * @param htmlContent - The HTML content to be included in the Svelte file.
 * @returns A string representing the complete content of a Svelte file.
 */
export function constructFinalSvelteFile(htmlContent: any) {
    const importStatements = generateImportStatements(htmlContent);
    return `<script>\n${importStatements}\n</script>\n${htmlContent}`;
  }
