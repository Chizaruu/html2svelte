import { flags, Command } from '@oclif/command';
import { cli } from 'cli-ux';
const fs = require('fs').promises;
import fsSync from 'fs';
import path from 'path';
import { run as convertHtmlToSvelte } from '../html2svelte/index';

// Asynchronously reads a file and returns its content
async function readFileAsync(filePath: any) {
  return fs.readFile(filePath, 'utf8');
}

class HtmlToSvelteConverter extends Command {
  async run() {
    try {
      const { flags, args } = this.parse(HtmlToSvelteConverter);
      cli.action.start('Starting HTML to Svelte conversion');

      const htmlFilePath = args.file;
      await this.ensureOutputDirectory(flags.outDir);
      let htmlContent = await readFileAsync(htmlFilePath);

      await this.processHtmlConversion(htmlContent, {
        prefix: flags.prefix,
        outDir: flags.outDir,
      });

      cli.action.stop('Conversion complete!');
      console.log(
        '✅ All HTML files have been successfully converted to Svelte components.'
      );
    } catch (error) {
      console.error('An error occurred during the conversion process:', error);
      cli.action.stop('Conversion failed.');
    }
  }

  async ensureOutputDirectory(directoryPath: any) {
    if (!fsSync.existsSync(directoryPath)) {
      await fs.mkdir(directoryPath);
    }
  }

  async processHtmlConversion(
    htmlContent: string,
    flags: { prefix: string; outDir: string }
  ) {
    let isConversionComplete = false;
    let stringCopy = htmlContent;

    while (!isConversionComplete) {
      const conversionResult = await convertHtmlToSvelte({
        prefix: flags.prefix,
        htmlString: stringCopy,
        onFinalFileComplete: this.handleFileGeneration.bind(this, flags.outDir),
      });

      isConversionComplete = conversionResult.blocks.length === 0;
      stringCopy = conversionResult.stringCopy;
    }

    const finalSvelteFileContent = this.constructFinalSvelteFile(stringCopy);
    await fs.writeFile(
      path.join(flags.outDir, 'App.svelte'),
      finalSvelteFileContent
    );
  }

  handleFileGeneration(
    outputDirectory: string,
    fileName: string,
    fileContent: string
  ) {
    const filePath = path.join(outputDirectory, `${fileName}.svelte`);
    return fs.writeFile(filePath, fileContent);
  }

  constructFinalSvelteFile(htmlContent: any) {
    const importStatements = this.generateImportStatements(htmlContent);
    return `<script>\n${importStatements}\n</script>\n${htmlContent}\n\n<style>\n\n</style>\n`;
  }

  generateImportStatements(htmlContent: string) {
    const componentTags = htmlContent.match(/<[A-Z].* \/>/g) ?? [];
    return componentTags
      .map(
        (tag) =>
          `import ${tag.slice(1, -3)} from './${tag.slice(1, -3)}.svelte';`
      )
      .join('\n');
  }
}

HtmlToSvelteConverter.description =
  'Converts a HTML file to Svelte components.';

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
    description: 'Directory to output the converted Svelte files',
    default: 'build',
  }),
  prefix: flags.string({
    char: 'p',
    description: 'Prefix used to identify elements for conversion',
    default: 'comp_',
  }),
};

module.exports = HtmlToSvelteConverter;
