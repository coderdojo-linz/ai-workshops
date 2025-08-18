import { extractFirstHtmlIsland } from './htmlDataReplacer';

describe('extractFirstHtmlIsland', () => {
  const mockDataLoader = jest.fn();

  beforeEach(() => {
    mockDataLoader.mockClear();
  });

  describe('Basic HTML extraction', () => {
    it('should extract a simple HTML block', async () => {
      const content = `
Some text before
\`\`\`html
<div>Hello World</div>
\`\`\`
Some text after
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div>Hello World</div>');
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should extract multi-line HTML block', async () => {
      const content = `
\`\`\`html
<div>
  <h1>Title</h1>
  <p>Content</p>
</div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div>\n  <h1>Title</h1>\n  <p>Content</p>\n</div>');
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

  describe('Data replacement functionality', () => {
    it('should replace <|DATA|> placeholder with data loader content', async () => {
      const mockData = '<span>Dynamic content</span>';
      mockDataLoader.mockResolvedValue(mockData);

      const content = `
\`\`\`html
<div><|DATA|></div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div><span>Dynamic content</span></div>');
      expect(mockDataLoader).toHaveBeenCalledTimes(1);
    });

    it('should not replace <|DATA|> when dataLoader returns undefined', async () => {
      mockDataLoader.mockResolvedValue(undefined);

      const content = `
\`\`\`html
<div><|DATA|></div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div><|DATA|></div>');
      expect(mockDataLoader).toHaveBeenCalledTimes(1);
    });

    it('should not replace <|DATA|> when dataLoader returns null', async () => {
      mockDataLoader.mockResolvedValue(null);

      const content = `
\`\`\`html
<div><|DATA|></div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div><|DATA|></div>');
      expect(mockDataLoader).toHaveBeenCalledTimes(1);
    });

    it('should not call dataLoader when no <|DATA|> placeholder exists', async () => {
      const content = `
\`\`\`html
<div>No placeholder here</div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div>No placeholder here</div>');
      expect(mockDataLoader).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should return null when no HTML block exists', async () => {
      const content = 'Just some regular text with no HTML blocks';

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBeNull();
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should return null when HTML block is empty', async () => {
      const content = `
\`\`\`html
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBeNull();
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should return null when HTML block contains only whitespace', async () => {
      const content = `
\`\`\`html


\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBeNull();
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should handle unclosed HTML block', async () => {
      const content = `
\`\`\`html
<div>Unclosed block
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBeNull();
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should handle HTML block without opening marker', async () => {
      const content = `
<div>No opening marker</div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBeNull();
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should ignore non-html code blocks', async () => {
      const content = `
\`\`\`javascript
console.log('not html');
\`\`\`

\`\`\`html
<div>Real HTML</div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<div>Real HTML</div>');
      expect(mockDataLoader).not.toHaveBeenCalled();
    });

    it('should handle dataLoader that throws an error', async () => {
      mockDataLoader.mockRejectedValue(new Error('Data loading failed'));

      const content = `
\`\`\`html
<div><|DATA|></div>
\`\`\`
      `.trim();

      await expect(extractFirstHtmlIsland(content, mockDataLoader)).rejects.toThrow('Data loading failed');
      expect(mockDataLoader).toHaveBeenCalledTimes(1);
    });
  });

    it('should handle complex HTML with data replacement', async () => {
      const mockData = '{"name": "John", "age": 30}';
      mockDataLoader.mockResolvedValue(mockData);

      const content = `
\`\`\`html
<script>
  const userData = \`<|DATA|>\`;
  console.log(userData);
</script>
<div id="user-info">
  Data will be loaded here: <|DATA|>
</div>
\`\`\`
      `.trim();

      const result = await extractFirstHtmlIsland(content, mockDataLoader);
      
      expect(result).toBe('<script>\n  const userData = `{"name": "John", "age": 30}`;\n  console.log(userData);\n</script>\n<div id="user-info">\n  Data will be loaded here: {"name": "John", "age": 30}\n</div>');
      expect(mockDataLoader).toHaveBeenCalledTimes(1);
    });
  });
});
