import { createRoot } from 'react-dom/client';

function App() {
  return (
    <main>
      <h1>FinDog</h1>
      <p>Chrome extension popup placeholder</p>
    </main>
  );
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Popup root element not found');
}

createRoot(container).render(<App />);
