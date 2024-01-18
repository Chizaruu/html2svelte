import { flags, Command } from '@oclif/command';
import { cli } from 'cli-ux';
import path from 'path';
import { convertHtmlToSvelte } from '../html2svelte/index';
import { constructFinalSvelteFile } from '../modules/HtmlProcessor';
import {
  ensureDirectoryExists,
  handleFileGeneration,
  readFileAsync,
  writeFile,
} from '../modules/FileSystemOps';

class HtmlToSvelteConverter extends Command {
  async run() {
    try {
      const { flags, args } = this.parse(HtmlToSvelteConverter);
      cli.action.start('Starting HTML to Svelte conversion');

      const htmlFilePath = args.file;
      await ensureDirectoryExists(flags.outDir);
      let htmlContent = await readFileAsync(htmlFilePath);

      const outputFileName = path.basename(htmlFilePath, '.html') + '.svelte';
      const outputFilePath = path.join(flags.outDir, outputFileName);
      await this.processHtmlConversion(
        htmlContent,
        { prefix: flags.prefix, outDir: flags.outDir },
        outputFilePath
      );

      cli.action.stop('Conversion complete!');
      console.log(
        `✅ HTML file ${htmlFilePath} has been successfully converted to ${outputFilePath}.`
      );
    } catch (error) {
      console.error('An error occurred during the conversion process:', error);
      cli.action.stop('Conversion failed.');
    }
  }

  async processHtmlConversion(
    htmlContent: string,
    flags: { prefix: string; outDir: string },
    outputFilePath: string
  ) {
    let isConversionComplete = false;
    let stringCopy = htmlContent;

    while (!isConversionComplete) {
      const conversionResult = await convertHtmlToSvelte({
        prefix: flags.prefix,
        htmlString: stringCopy,
        onFinalFileComplete: handleFileGeneration.bind(
          this,
          path.dirname(outputFilePath)
        ),
      });

      isConversionComplete = conversionResult.blocks.length === 0;
      stringCopy = conversionResult.stringCopy;
    }

    const finalSvelteFileContent = constructFinalSvelteFile(stringCopy);
    await writeFile(
      path.join(flags.outDir, 'App.svelte'),
      finalSvelteFileContent
    );
  }
}

HtmlToSvelteConverter.description =
  'Converts a single HTML file to a Svelte component.';

HtmlToSvelteConverter.args = [
  {
    name: 'file',
    description: 'Path to the HTML file to be converted',
    required: true,
  },
];

HtmlToSvelteConverter.flags = {
  outDir: flags.string({
    char: 'o',
    description: 'Directory to output the converted Svelte file',
    default: 'build',
  }),
  prefix: flags.string({
    char: 'p',
    description: 'Prefix used to identify elements for conversion',
    default: 'comp_',
  }),
};

module.exports = HtmlToSvelteConverter;
