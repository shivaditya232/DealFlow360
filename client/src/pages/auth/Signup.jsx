import React from 'react';
import SignupBrandPanel from '../../components/layout/SignupBrandPanel';
import SignupForm from '../../components/auth/SignupForm';

/**
 * DealFlow360 Enterprise Signup Page
 * 
 * Split-screen layout:
 * - Left: Dark navy brand panel with 5-stage Quote-to-Cash workflow
 * - Right: Clean enterprise signup form with role selection & password validation
 */
export default function Signup() {
  return (
    <div className="df-login-container df-signup-page-container">
      {/* LEFT PANEL: Enterprise Brand Panel */}
      <SignupBrandPanel />

      {/* RIGHT PANEL: Enterprise Signup Form */}
      <main className="df-form-panel df-signup-form-panel">
        <SignupForm />
      </main>
    </div>
  );
}
