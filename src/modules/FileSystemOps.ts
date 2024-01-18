import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';

/**
 * Asynchronously reads the content of a file at the given path.
 * @param filePath - The path to the file to be read.
 * @returns A promise that resolves to the content of the file.
 */
export async function readFileAsync(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

/**
 * Asynchronously writes content to a file at the given path. 
 * If the file does not exist, it will be created.
 * @param filePath - The path to the file where content will be written.
 * @param content - The content to write to the file.
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  return fs.writeFile(filePath, content);
}

/**
 * Ensures that a directory exists at the given path. 
 * If the directory does not exist, it will be created.
 * @param directoryPath - The path to the directory to check or create.
 */
export async function ensureDirectoryExists(directoryPath: string): Promise<void> {
  if (!fsSync.existsSync(directoryPath)) {
    await fs.mkdir(directoryPath, { recursive: true });
  }
}

export async function handleFileGeneration(outputDirectory: string, fileName: string, fileContent: any) {
  // If the source HTML file is named 'index', rename the Svelte file to 'App'
  const svelteFileName = fileName === 'index' ? 'App' : fileName;
  const filePath = path.join(outputDirectory, `${svelteFileName}.svelte`);
  return fs.writeFile(filePath, fileContent);
}
