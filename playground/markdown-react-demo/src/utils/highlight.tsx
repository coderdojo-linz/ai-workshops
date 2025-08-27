import React from 'react';
import Highlight from 'react-highlight';

// react-highlight's typings are not React 18-friendly for JSX; wrap with a safely-typed component
export const CodeHighlight: React.FC<{ className?: string; children: React.ReactNode }>
  = ({ className, children }) => {
  const Comp = Highlight as unknown as React.ComponentType<any>;
  return <Comp className={className}>{children}</Comp>;
};
