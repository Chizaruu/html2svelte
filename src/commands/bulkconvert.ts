import { flags, Command } from '@oclif/command';
import { cli } from 'cli-ux';
const fs = require('fs').promises;
import fsSync from 'fs';
import path from 'path';
import klaw from 'klaw';
import { run as convertHtmlToSvelte } from '../html2svelte/index';

class BulkHtmlToSvelteConverter extends Command {
  async run() {
    const { flags } = this.parse(BulkHtmlToSvelteConverter);
    cli.action.start('Starting bulk HTML to Svelte conversion');

    try {
     await this.ensureOutputDirectory(flags.outDir);
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
  const files = await this.getHtmlFiles(folderPath);
  for (const file of files) {
    const htmlContent = await fs.readFile(file, 'utf8');
    const relativeFilePath = path.relative(folderPath, file);
    const targetFilePath = path.join(flags.outDir, relativeFilePath);
    await this.processHtmlConversion(htmlContent, flags, targetFilePath);
  }
}

  async processHtmlConversion(htmlContent: any, flags: { prefix: any; outDir: string; }, targetFilePath: string) {
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
   
   // Ensure the target directory exists
   const targetDirectory = path.dirname(targetFilePath);
   await this.ensureOutputDirectory(targetDirectory);

   const finalSvelteFileContent = this.constructFinalSvelteFile(stringCopy);
   
    const finalFileName = path.basename(targetFilePath, '.html') === 'index'
    ? 'App.svelte'
    : `${path.basename(targetFilePath, '.html')}.svelte`;
  await fs.writeFile(path.join(targetDirectory, finalFileName), finalSvelteFileContent);
 }

 async getHtmlFiles(dir: string): Promise<string[]> {
  let htmlFiles: string[] = [];
  for await (const file of klaw(dir)) {
    if (path.extname(file.path) === '.html') {
      htmlFiles.push(file.path);
    }
  }
  return htmlFiles;
}

  handleFileGeneration(outputDirectory: string, fileName: string, fileContent: any) {
  // If the source HTML file is named 'index', rename the Svelte file to 'App'
  const svelteFileName = fileName === 'index' ? 'App' : fileName;
  const filePath = path.join(outputDirectory, `${svelteFileName}.svelte`);
  return fs.writeFile(filePath, fileContent);
}


  constructFinalSvelteFile(htmlContent: any) {
    const importStatements = this.generateImportStatements(htmlContent);
    return `<script>\n${importStatements}\n</script>\n${htmlContent}\n\n<style>\n\n</style>\n`;
  }

  generateImportStatements(htmlContent: { match: (arg0: RegExp) => never[]; }) {
    const componentTags = htmlContent.match(/<[A-Z].* \/>/g) ?? [];
    return componentTags
      .map((tag: string | any[]) => `import ${tag.slice(1, -3)} from './${tag.slice(1, -3)}.svelte';`)
      .join('\n');
  }

  async ensureOutputDirectory(directoryPath: fsSync.PathLike) {
    if (!fsSync.existsSync(directoryPath)) {
      await fs.mkdir(directoryPath, { recursive: true });
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
