import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import Markdown from 'react-markdown';

import { CodeHighlight } from './utils/highlight';
import Callout from './components/Callout'
import './index.css';
import 'highlight.js/styles/github.css';
import { getTextFromChildren } from './utils/utility'
import { Clipboard, ClipboardCheck } from 'lucide-react';

const markdown = `
# Hi, *Pluto*!
\`\`\`python
console.log("Hello, Pluto!");
if (true) {
  console.log("This is true");
}
\`\`\`
`;

function App() {
  const [isCopy, setIsCopy] = useState(false);

  function handleCopy(copyText: string) {
    navigator.clipboard.writeText(copyText);
    setIsCopy(true);
    setTimeout(() => setIsCopy(false), 2000);
  }

  return (
    <div className="App">
      <div className="content">
        <Markdown
          components={{
            code(props) {
              const { children } = props;
              console.log('props', props);
              const text = getTextFromChildren(children);
              return (
                <Callout title='Code' icon='FileCode2' foldable content={
                  <>
                    <button onClick={() => (text ? handleCopy(text) : true)} className='copyButton'>{isCopy ? <ClipboardCheck size={18} /> : <Clipboard size={18} />}</button>
                    <CodeHighlight className='hljs'>{children}</CodeHighlight>
                  </>
                } />
              );
            }
          }}
        >{markdown}</Markdown>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
