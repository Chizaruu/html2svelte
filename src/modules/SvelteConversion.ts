import { convertHtmlToSvelte } from '../html2svelte/index';
import { createSvelteFileContent } from './HtmlProcessor';
import * as FileSystemOps from './FileSystemOps';
import path from 'path';

/**
 * Processes the conversion of HTML content to a Svelte component.
 * @param htmlContent - The HTML content to be converted.
 * @param flags - Configuration flags for the conversion (prefix, output directory).
 * @param targetFilePath - The path where the converted Svelte file should be saved.
 * @param handleFileName - Optional function to handle the naming of generated Svelte files.
 */
export async function processHtmlConversion(
  htmlContent: string,
  flags: { prefix: string; outDir: string },
  targetFilePath: string,
  handleFileName?: (fileName: string) => string
): Promise<void> {
  let isConversionComplete = false;
  let stringCopy = htmlContent;
  
  // Handle the main target file name
  const baseFileName = path.basename(targetFilePath, '.svelte');
  const finalTargetFileName = handleFileName ? handleFileName(baseFileName) : baseFileName;
  const finalTargetFilePath = path.join(path.dirname(targetFilePath), `${finalTargetFileName}.svelte`);

  while (!isConversionComplete) {
    const conversionResult = await convertHtmlToSvelte({
      prefix: flags.prefix,
      htmlString: stringCopy,
      onFinalFileComplete: async (fileName, fileContent) => {
        const finalFileName = handleFileName ? handleFileName(fileName) : fileName;
        const finalPath = path.join(path.dirname(targetFilePath), `${finalFileName}.svelte`);
        await FileSystemOps.writeFileAsync(finalPath, fileContent);
      },
    });

    isConversionComplete = conversionResult.blocks.length === 0;
    stringCopy = conversionResult.stringCopy;
  }

  const finalSvelteFileContent = createSvelteFileContent(stringCopy);
  await FileSystemOps.writeFileAsync(finalTargetFilePath, finalSvelteFileContent);
}
