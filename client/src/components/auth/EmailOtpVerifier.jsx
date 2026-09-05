import React, { useEffect, useRef, useState } from 'react';
import { MailCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import otpService from '../../services/otp.service';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Pre-signup email verification widget.
 *
 * Sits under the email field on the signup form. The account isn't created
 * until this reports back verified — see SignupForm's handleSubmit, and
 * server/src/services/auth.service.js signup() which independently enforces
 * the same thing (never trust the client alone for this).
 *
 * `email` / `emailValid` come from the parent form. `status` is lifted up via
 * onStatusChange so the parent can gate its submit button:
 *   'idle' | 'sent' | 'verified'
 */
export default function EmailOtpVerifier({ email, emailValid, status, onStatusChange, disabled }) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const lastSentFor = useRef(null);

  // If the email changes after we sent/verified a code for a DIFFERENT
  // address, the old verification no longer applies to what's in the field.
  useEffect(() => {
    if (lastSentFor.current && lastSentFor.current !== email && status !== 'idle') {
      onStatusChange('idle');
      setCode('');
      setInfo('');
      setError('');
    }
  }, [email, status, onStatusChange]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSend = async () => {
    if (!emailValid || sending || cooldown > 0) return;
    setSending(true);
    setError('');
    setInfo('');
    try {
      const result = await otpService.request(email);
      lastSentFor.current = email;
      onStatusChange('sent');
      setInfo(
        result?.emailSent === false
          ? 'Email delivery isn\'t working right now (SMTP not configured) — the code was printed to the server console instead. Check there.'
          : `Code sent to ${email}. It expires in 2 minutes.`
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const backendError = err.response?.data?.error;
      setError(backendError || 'Could not send a verification code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setError('');
    try {
      await otpService.verify(email, code);
      onStatusChange('verified');
      setInfo('Email verified.');
    } catch (err) {
      const backendError = err.response?.data?.error;
      setError(backendError || 'Incorrect or expired code.');
    } finally {
      setVerifying(false);
    }
  };

  if (status === 'verified') {
    return (
      <div className="df-otp-verified-badge" role="status">
        <ShieldCheck size={15} />
        <span>Email verified</span>
      </div>
    );
  }

  return (
    <div className="df-otp-verifier">
      {status === 'idle' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<MailCheck size={14} />}
          disabled={disabled || !emailValid || sending}
          loading={sending}
          loadingText="Sending code…"
          onClick={handleSend}
        >
          Send verification code
        </Button>
      )}

      {status === 'sent' && (
        <div className="df-otp-code-row">
          <input
            id="otp-code"
            name="otpCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={disabled || verifying}
            className="df-input df-otp-code-input"
            aria-label="Enter the 6-digit code sent to your email"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={disabled || code.length !== 6 || verifying}
            loading={verifying}
            loadingText="Verifying…"
            onClick={handleVerify}
          >
            Verify
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || sending || cooldown > 0}
            onClick={handleSend}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Button>
        </div>
      )}

      <div className="df-input-feedback-slot">
        {error ? (
          <div className="df-error-text" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : info ? (
          <div className="df-helper-text">{info}</div>
        ) : null}
      </div>
    </div>
  );
}
