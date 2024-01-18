import { promises as fs } from 'fs';
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
export async function writeFileAsync(
  filePath: string,
  content: string,
): Promise<void> {
  return fs.writeFile(filePath, content);
}

/**
 * Ensures that a directory exists at the given path.
 * If the directory does not exist, it will be created.
 * @param directoryPath - The path to the directory to check or create.
 */
export async function ensureDirectoryExists(
  directoryPath: string,
): Promise<void> {
  try {
    await fs.access(directoryPath);
  } catch {
    await fs.mkdir(directoryPath, { recursive: true });
  }
}

/**
 * Generates a Svelte file in the specified directory with the given content.
 * If the source HTML file is named 'index', the Svelte file is named 'App.svelte'.
 * @param outputDirectory - The directory where the Svelte file will be created.
 * @param fileName - The base name for the Svelte file.
 * @param fileContent - The content to be written to the Svelte file.
 */
export async function generateSvelteFileAsync(
  outputDirectory: string,
  fileName: string,
  fileContent: string,
): Promise<void> {
  const svelteFileName = fileName === 'index' ? 'App' : fileName;
  const filePath = path.join(outputDirectory, `${svelteFileName}.svelte`);
  await writeFileAsync(filePath, fileContent);
}
