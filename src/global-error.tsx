'use client';

import React from 'react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
    
    // Check if it's the authorizedDomains error
    if (error.message?.includes('authorizedDomains')) {
      console.error('Firebase authorizedDomains error - check your Firebase Console configuration');
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong!</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {error.message}
          </details>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 20px',
              marginTop: '10px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
