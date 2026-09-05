import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Last line of defense: if a render throws anywhere below this (e.g. a
// response shape we didn't expect while offline/degraded), show a
// recoverable screen instead of a blank white page. Network failures
// themselves shouldn't ever reach here — pages already guard against
// null data while a fetch is pending/failed — this is the backstop for
// whatever we didn't think of.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[DealFlow360] Unhandled UI error:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="df-crash-screen">
        <div className="df-crash-icon"><AlertTriangle size={28} /></div>
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Your data is safe — reloading usually fixes this.</p>
        <button type="button" className="df-btn df-btn-primary df-btn-sm" onClick={this.handleReload}>
          <RefreshCw size={14} /> Reload
        </button>
      </div>
    );
  }
}
