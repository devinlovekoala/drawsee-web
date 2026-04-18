import { createContext, useContext, useState, ReactNode } from 'react';

interface DocumentContextType {
  documentListVersion: number;
  triggerDocumentListRefresh: () => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [documentListVersion, setDocumentListVersion] = useState(0);

  const triggerDocumentListRefresh = () => {
    console.log('触发文档列表刷新，版本号:', documentListVersion + 1);
    setDocumentListVersion(prev => prev + 1);
  };

  return (
    <DocumentContext.Provider value={{ documentListVersion, triggerDocumentListRefresh }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocumentContext = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocumentContext must be used within a DocumentProvider');
  }
  return context;
};
