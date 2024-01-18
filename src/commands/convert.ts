import { flags, Command } from '@oclif/command';
import { cli } from 'cli-ux';
import path from 'path';
import * as FileSystemOps from '../modules/FileSystemOps';
import { processHtmlConversion } from '../modules/SvelteConversion';

class HtmlToSvelteConverter extends Command {
  async run() {
    try {
      const { flags, args } = this.parse(HtmlToSvelteConverter);
      cli.action.start('Starting HTML to Svelte conversion');

      const htmlFilePath = args.file;
      await FileSystemOps.ensureDirectoryExists(flags.outDir);
      let htmlContent = await FileSystemOps.readFileAsync(htmlFilePath);

      const outputFileName = path.basename(htmlFilePath, '.html') + '.svelte';
      const outputFilePath = path.join(flags.outDir, outputFileName);
      await processHtmlConversion(
        htmlContent,
        { prefix: flags.prefix, outDir: flags.outDir },
        outputFilePath,
        (fileName) => (fileName === 'index' ? 'App' : fileName)
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
