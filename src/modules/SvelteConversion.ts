import { convertHtmlToSvelte } from '../html2svelte/index';
import { constructFinalSvelteFile } from './HtmlProcessor';
import * as FileSystemOps from './FileSystemOps';
import path from 'path';

/**
 * Processes the conversion of HTML content to a Svelte component.
 * @param htmlContent - The HTML content to be converted.
 * @param flags - Configuration flags for the conversion (prefix, output directory).
 * @param targetFilePath - The path where the converted Svelte file should be saved.
 */
export async function processHtmlConversion(
  htmlContent: string,
  flags: { prefix: string; outDir: string },
  targetFilePath: string
): Promise<void> {
  const conversionResult = await convertHtmlToSvelte({
    prefix: flags.prefix,
    htmlString: htmlContent,
    onFinalFileComplete: async (fileName: any, fileContent: string) => {
      const finalPath = path.join(path.dirname(targetFilePath), `${fileName}.svelte`);
      await FileSystemOps.writeFile(finalPath, fileContent);
    },
  });

  if (conversionResult.blocks.length === 0) {
    const finalSvelteFileContent = constructFinalSvelteFile(htmlContent);
    await FileSystemOps.writeFile(targetFilePath, finalSvelteFileContent);
  }
}
