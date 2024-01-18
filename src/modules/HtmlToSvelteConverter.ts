import parser, { HTMLElement } from 'node-html-parser';
import prettier from 'prettier';

interface BlockData {
  level: number;
  start: number;
  end: number;
  componentName: string;
  newComp: string;
  diff: number;
}

function hasClassAttribute(node: HTMLElement): boolean {
  return node.rawAttrs?.includes('class');
}

function extractComponentName(
  node: HTMLElement,
  prefix: string
): string | null {
  const classMatch = node.rawAttrs?.match(/class="([^"]*)"/);
  if (!classMatch || !classMatch[1].startsWith(prefix)) return null;

  let firstClass = classMatch[1].split(' ')[0].slice(prefix.length);
  return firstClass.split('-').map(capitalize).join('');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createBlockData(
  node: HTMLElement,
  componentName: string,
  level: number
): BlockData {
  const [start, end] = node.range;
  const newComp = `<${componentName} />`;
  return {
    level: level - 2,
    start,
    end,
    componentName,
    newComp,
    diff: end - start - newComp.length,
  };
}

export function splitHTMLTree(prefix: string, root: HTMLElement): BlockData[] {
  function processNode(node: HTMLElement, level: number = 0): BlockData[] {
    const blocks: BlockData[] = node.childNodes.flatMap((child) =>
      child instanceof HTMLElement ? processNode(child, level + 1) : []
    );

    if (hasClassAttribute(node)) {
      const componentName = extractComponentName(node, prefix);
      if (componentName) {
        blocks.push(createBlockData(node, componentName, level));
      }
    }
    return blocks;
  }

  return processNode(root);
}

export const convertHtmlToSvelte = async ({
  prefix,
  htmlString,
  onFinalFileComplete,
}: {
  prefix: string;
  htmlString: string;
  onFinalFileComplete: (fileName: string, fileContent: string) => void;
}) => {
  const htmlTree = parser.parse(htmlString, {
    lowerCaseTagName: true,
    comment: false,
    voidTag: {
      tags: [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr',
      ],
    },
    blockTextElements: {
      script: true,
      noscript: true,
      style: true,
      pre: true,
    },
  });

  let blocks = splitHTMLTree(prefix, htmlTree);
  if (blocks.length === 0) return { stringCopy: htmlString, blocks };

  const firstBlock = blocks.shift();
  if (!firstBlock) return { stringCopy: htmlString, blocks: [] };

  adjustBlocks(firstBlock, blocks);

  const firstBlockString = htmlString.substring(
    firstBlock.start,
    firstBlock.end
  );
  const importString = buildImportString(firstBlockString);

  const updatedHtmlString = removeCompPrefixFromDivClasses(
    firstBlockString,
    prefix
  );

  const fullFile = `<script>${importString}</script>${updatedHtmlString}`;

  const cleanedFullFile = removeEmptyScriptTags(fullFile);

  const formattedFullFile = await prettier.format(cleanedFullFile, {
    parser: 'html',
  });

  onFinalFileComplete(firstBlock.componentName, formattedFullFile); 

  return {
    stringCopy: replaceHtmlWithComponent(htmlString, firstBlock),
    blocks,
  };
};

function adjustBlocks(firstBlock: BlockData, blocks: BlockData[]) {
  blocks.forEach((block) => {
    const offset = block.start >= firstBlock.start ? firstBlock.diff : 0;
    block.start -= offset;
    block.end -= offset;
  });
}

function buildImportString(htmlString: string): string {
  return (htmlString.match(/<[A-Z].* \/>/g) ?? [])
    .map(
      (tag) => `import ${tag.slice(1, -3)} from './${tag.slice(1, -3)}.svelte';`
    )
    .join('\n');
}

function replaceHtmlWithComponent(
  htmlString: string,
  block: BlockData
): string {
  return (
    htmlString.slice(0, block.start) +
    block.newComp +
    htmlString.slice(block.end)
  );
}

function removeEmptyScriptTags(htmlString: string): string {
  return htmlString.replace(/<script>\s*<\/script>/g, '');
}

function removeCompPrefixFromDivClasses(
  htmlString: string,
  prefix: string
): string {
  const htmlTree = parser.parse(htmlString);

  htmlTree.querySelectorAll('div').forEach((div) => {
    const classAttr = div.getAttribute('class');
    if (classAttr) {
      const classNames = classAttr.split(' ');
      if (classNames.some((className) => className.startsWith(prefix))) {
        const updatedClassNames = classNames
          .map((className) =>
            className.startsWith(prefix)
              ? className.slice(prefix.length)
              : className
          )
          .join(' ');
        div.setAttribute('class', updatedClassNames);
      }
    }
  });

  return htmlTree.toString();
}
