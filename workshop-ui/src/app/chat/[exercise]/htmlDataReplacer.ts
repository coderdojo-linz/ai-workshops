export async function extractFirstHtmlIsland(content: string, dataLoader: () => Promise<string | undefined>): Promise<string | null> {
    const lines = content.split('\n');
    let inHtmlBlock = false;
    let currentHtmlBlock = '';

    for (const line of lines) {
      if (line.trim() === '```html' && !inHtmlBlock) {
        inHtmlBlock = true;
        currentHtmlBlock = '';
      } else if (line.trim() === '```' && inHtmlBlock) {
        if (currentHtmlBlock.trim()) {
          let htmlContent = currentHtmlBlock.trim();

          // Check if HTML island contains <|DATA|> placeholder
          if (htmlContent.includes('<|DATA|>')) {
            const dataFileContent = await dataLoader();
            if (dataFileContent) {
              htmlContent = htmlContent.replaceAll("<|DATA|>", dataFileContent);
            }
          }

          return htmlContent;
        }
        return null;
      } else if (inHtmlBlock) {
        currentHtmlBlock += line + '\n';
      }
    }

    return null;
  };
