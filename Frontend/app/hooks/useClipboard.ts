import { useState } from 'react';

type CopyStatus = 'idle' | 'success' | 'error';

export const useClipboard = (timeoutDuration = 2000) => {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    if (!text) {
      console.warn('No text provided to copy');
      setStatus('error');
      return;
    }

    setCopiedText(text);

    try {
      // Modern clipboard API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (!successful) {
          throw new Error('Copy command unsuccessful');
        }
        
        document.body.removeChild(textArea);
      }

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setCopiedText(null);
      }, timeoutDuration);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), timeoutDuration);
    }
  };

  return { 
    copyToClipboard,
    status,
    isCopied: status === 'success',
    copiedText,
    reset: () => {
      setStatus('idle');
      setCopiedText(null);
    }
  };
};