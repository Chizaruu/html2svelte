import { Command, Flags, Args, ux } from '@oclif/core';
import path from 'path';
import * as FileSystemOps from '../modules/FileSystemOps';
import { processHtmlConversion } from '../modules/SvelteConversion';

export default class HtmlToSvelteConverter extends Command {
  static description = 'Converts a single HTML file to a Svelte component.';

  static args = {
    file: Args.string({
      description: 'Path to the HTML file to be converted',
      required: true,
    }),
  };

  static flags = {
    outDir: Flags.string({
      char: 'o',
      description: 'Directory to output the converted Svelte file',
      default: 'build',
    }),
    prefix: Flags.string({
      char: 'p',
      description: 'Prefix used to identify elements for conversion',
      default: 'comp_',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(HtmlToSvelteConverter);
    ux.action.start('Starting HTML to Svelte conversion');

    try {
      const htmlFilePath = args.file;
      await FileSystemOps.ensureDirectoryExists(flags.outDir);
      const htmlContent = await FileSystemOps.readFileAsync(htmlFilePath);

      const outputFileName = path.basename(htmlFilePath, '.html') + '.svelte';
      const outputFilePath = path.join(flags.outDir, outputFileName);
      await processHtmlConversion(
        htmlContent,
        { prefix: flags.prefix, outDir: flags.outDir },
        outputFilePath,
        (fileName) => (fileName === 'index' ? 'App' : fileName),
      );

      ux.action.stop('Conversion complete!');
      ux.log(
        `✅ HTML file ${htmlFilePath} has been successfully converted to ${outputFilePath}.`,
      );
    } catch (error) {
      ux.action.stop('Conversion failed.');
      ux.error(`An error occurred during the conversion process: ${error}`);
    }
  }
}

module.exports = HtmlToSvelteConverter;
