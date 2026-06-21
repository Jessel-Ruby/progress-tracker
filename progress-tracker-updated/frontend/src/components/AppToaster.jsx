import { Toaster } from 'react-hot-toast';

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0f0f14',
          color: '#f3f4f6',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#22d3ee',
            secondary: '#0f0f14',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#0f0f14',
          },
        },
      }}
    />
  );
}
