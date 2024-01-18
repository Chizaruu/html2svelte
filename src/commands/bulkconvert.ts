import { flags, Command } from '@oclif/command';
import { cli } from 'cli-ux';
import path from 'path';
import klaw from 'klaw';
import * as FileSystemOps from '../modules/FileSystemOps';
import { processHtmlConversion } from '../modules/SvelteConversion';

class BulkHtmlToSvelteConverter extends Command {
  async run() {
    const { flags } = this.parse(BulkHtmlToSvelteConverter);
    cli.action.start('Starting bulk HTML to Svelte conversion');

    try {
     await FileSystemOps.ensureDirectoryExists(flags.outDir);
     await this.processFolder(flags.folder, { prefix: flags.prefix, outDir: flags.outDir });

     cli.action.stop('Conversion complete!');
     console.log(
      '✅ All HTML files in the folder have been successfully converted to Svelte components.'
     );
    } catch (error) {
     console.error('An error occurred during the conversion process:', error);
     cli.action.stop('Conversion failed.');
    }
  }
  
   async processFolder(folderPath: string, flags: { prefix: string; outDir: string; }) {
    // Walk through all the files in the folder and its subfolders
    for await (const file of klaw(folderPath)) {
      // Process only HTML files
      if (path.extname(file.path) === '.html') {
        // Read the content of the HTML file
        const htmlContent = await FileSystemOps.readFileAsync(file.path);
        
        // Construct the target file path by replacing the base folder path with the output directory
        const relativeFilePath = path.relative(folderPath, file.path);
        const targetFilePath = path.join(flags.outDir, relativeFilePath);

        // Ensure the directory for the target file exists
        const targetDirectory = path.dirname(targetFilePath);
        await FileSystemOps.ensureDirectoryExists(targetDirectory);

        // Rename 'index.html' to 'App.svelte' in the final path
        const svelteFilePath = targetFilePath.endsWith('index.html')
          ? path.join(path.dirname(targetFilePath), 'App.svelte')
          : targetFilePath.replace('.html', '.svelte');

        // Convert the HTML content and write the Svelte file to the target path
        await processHtmlConversion(htmlContent, flags, svelteFilePath);
      }
    }
  }
}

BulkHtmlToSvelteConverter.description = 'Converts all HTML files in a folder and its subfolders to Svelte components.';

BulkHtmlToSvelteConverter.flags = {
  folder: flags.string({
    char: 'f',
    description: 'Folder containing HTML files to be converted',
    required: true,
  }),
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

module.exports = BulkHtmlToSvelteConverter;
