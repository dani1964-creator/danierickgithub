
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { isDevelopmentHost } from '@/lib/tenant';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

function DebugOverlay() {
  const [brokerId, setBrokerId] = (window as any).__debugBrokerIdState || [null, (v: any) => {}];

  // Lazy import BrokerResolver to avoid heavy startup cost when not in debug
  ReactDebugInit();

  return (
    <div style={{position: 'fixed', left: 8, top: 8, zIndex: 9999}}>
      <div style={{background: 'rgba(0,0,0,0.7)', color: 'white', padding: 8, borderRadius: 6, fontSize: 12}}>
        <div><strong>DEBUG</strong></div>
        <div>host: {window.location.host}</div>
        <div>pathname: {window.location.pathname}</div>
        <div>isDevHost: {String(isDevelopmentHost())}</div>
        <div>resolved broker id: {brokerId ?? '(pending/null)'}</div>
        <div style={{marginTop:6}}>
          <button onClick={() => {
            try { (window as any).BrokerResolver?.clearCache(); alert('cache cleared'); } catch { alert('clear failed'); }
          }} style={{fontSize:11}}>Clear Broker Cache</button>
        </div>
      </div>
    </div>
  );
}

function ReactDebugInit() {
  // Start resolving broker id in background for overlay (non-blocking)
  if ((window as any).__debugBrokerIdState) return;
  const setState = (v: any) => { (window as any).__debugBrokerIdState![1](v); };
  (window as any).__debugBrokerIdState = [null, (v: any) => { (window as any).__debugBrokerIdState[0] = v; }];

  // Import BrokerResolver dynamically
  import('@/lib/brokerResolver').then(({ BrokerResolver }) => {
    (window as any).BrokerResolver = BrokerResolver;
    BrokerResolver.getCurrentBrokerId().then((id: any) => {
      (window as any).__debugBrokerIdState[0] = id;
      // also trigger a small mutation to update overlay
      const ev = new CustomEvent('debug:brokerId', { detail: id });
      window.dispatchEvent(ev);
    }).catch(() => {
      (window as any).__debugBrokerIdState[0] = null;
      const ev = new CustomEvent('debug:brokerId', { detail: null });
      window.dispatchEvent(ev);
    });
  }).catch(() => {});
}

// Simple small React shim to render overlay only when ?debug=1
const search = typeof window !== 'undefined' ? window.location.search : '';
const debugMode = search.includes('debug=1');

root.render(
  <>
    <App />
    {debugMode ? <DebugOverlay /> : null}
  </>
);
