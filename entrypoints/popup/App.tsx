import './App.css';

function App() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcut = isMac ? 'Cmd+K' : 'Ctrl+K';

  return (
    <div style={{ width: '320px', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>⚡ QuickBar</h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          A powerful command palette for Chrome
        </p>
      </div>

      <div
        style={{
          background: '#f5f5f5',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>
          <strong>Press {shortcut}</strong> to open QuickBar
        </p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Search tabs, bookmarks, history, and execute browser commands instantly.
        </p>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', color: '#333' }}>Features:</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
          <li>⚡ Fast tab switching</li>
          <li>🔖 Bookmark search</li>
          <li>🕐 History search</li>
          <li>⌨️ Browser commands</li>
          <li>🎯 Frecency-based ranking</li>
        </ul>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#999' }}>
          Inspired by Arc Browser
        </p>
      </div>
    </div>
  );
}

export default App;
