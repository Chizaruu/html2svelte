import { Command, Flags, Args, ux } from '@oclif/core';
import path from 'path';
import klaw from 'klaw';
import * as FileSystemOps from '../modules/FileSystemOps';
import { processHtmlConversion } from '../modules/SvelteConversion';

export default class BulkHtmlToSvelteConverter extends Command {
  static description =
    'Converts all HTML files in a folder and its subfolders to Svelte components.';

  static flags = {
    folder: Flags.string({
      char: 'f',
      description: 'Folder containing HTML files to be converted',
      required: true,
    }),
    outDir: Flags.string({
      char: 'o',
      description: 'Directory to output the converted Svelte files',
      default: 'build',
    }),
    prefix: Flags.string({
      char: 'p',
      description: 'Prefix used to identify elements for conversion',
      default: 'comp_',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BulkHtmlToSvelteConverter);
    ux.action.start('Starting bulk HTML to Svelte conversion');

    try {
      await FileSystemOps.ensureDirectoryExists(flags.outDir);
      await this.processFolder(flags.folder, {
        prefix: flags.prefix,
        outDir: flags.outDir,
      });

      ux.action.stop('Conversion complete!');
      ux.log(
        '✅ All HTML files in the folder have been successfully converted to Svelte components.',
      );
    } catch (error) {
      ux.action.stop('Conversion failed.');
      ux.error(`An error occurred during the conversion process: ${error}`);
    }
  }

  async processFolder(
    folderPath: string,
    flags: { prefix: string; outDir: string },
  ) {
    for await (const file of klaw(folderPath)) {
      if (path.extname(file.path) === '.html') {
        const htmlContent = await FileSystemOps.readFileAsync(file.path);
        const relativeFilePath = path.relative(folderPath, file.path);
        const targetFilePath = path.join(flags.outDir, relativeFilePath);
        const targetDirectory = path.dirname(targetFilePath);
        await FileSystemOps.ensureDirectoryExists(targetDirectory);
        const svelteFilePath = targetFilePath.endsWith('index.html')
          ? path.join(path.dirname(targetFilePath), 'App.svelte')
          : targetFilePath.replace('.html', '.svelte');

        await processHtmlConversion(htmlContent, flags, svelteFilePath);
      }
    }
  }
}

module.exports = BulkHtmlToSvelteConverter;
