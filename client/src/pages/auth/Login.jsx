import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Lock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Checkbox from '../../components/ui/Checkbox';
import LoginBrandPanel from '../../components/layout/LoginBrandPanel';
import { useAuth } from '../../context/AuthContext';
import { validateLoginForm, validateLoginField } from '../../validators/auth.validator';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, landing } = useAuth();

  const [formData, setFormData] = useState({
    companySlug: '',
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      const destination = landing === 'PORTAL' ? '/portal' : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, landing, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const nextData = {
      ...formData,
      [name]: fieldValue,
    };

    setFormData(nextData);

    // When the user starts correcting an invalid field,
    // remove the error once the value becomes valid according to Zod
    if (errors[name]) {
      const fieldError = validateLoginField(name, fieldValue, nextData);
      if (!fieldError) {
        setErrors((prev) => ({
          ...prev,
          [name]: '',
        }));
      }
    }

    if (submitFeedback) {
      setSubmitFeedback(null);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateLoginField(name, value, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) return;

    // Validate entire form with Zod schema
    const { isValid, errors: validationErrors } = validateLoginForm({
      companySlug: formData.companySlug,
      email: formData.email,
      password: formData.password,
    });

    if (!isValid) {
      setErrors(validationErrors);
      // Focus first error field for accessibility
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(
        firstErrorField === 'password' ? 'password' : `df-input-${firstErrorField}`
      );
      if (element) element.focus();
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const response = await login({
        companySlug: formData.companySlug.trim(),
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      setSubmitFeedback({
        type: 'success',
        message: 'Sign in successful. Redirecting...',
      });

      // Dispatch to backend-dictated landing
      const destination = response.landing === 'PORTAL' ? '/portal' : '/dashboard';
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (error) {
      const status = error.response ? error.response.status : null;
      const backendError = error.response?.data?.error;

      let message = 'Unable to sign in. Please try again.';

      if (status === 401) {
        message = backendError || 'Invalid credentials';
      } else if (status === 404) {
        message = backendError || 'Company not found';
      } else if (status === 429) {
        message = backendError || 'Too many failed login attempts. Try again in a few minutes.';
      } else if (status === 400) {
        message = backendError || 'Validation failed';
      } else if (status === 409) {
        message = backendError || 'Conflict occurred. Please check your credentials.';
      } else if (status === 500) {
        message = backendError || 'Internal server error';
      } else if (backendError) {
        message = backendError;
      }

      setSubmitFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="df-login-container">
      {/* LEFT PANEL: Enterprise Brand Panel */}
      <LoginBrandPanel />

      {/* RIGHT PANEL: Login Form */}
      <main className="df-form-panel">
        <div className="df-form-container">
          <header className="df-form-header">
            <h1 className="df-form-title">Welcome back</h1>
            <p className="df-form-subtitle">Sign in to continue to DealFlow360.</p>
          </header>

          {/* Feedback banner (shown during validation confirmation or error) */}
          {submitFeedback && (
            <div 
              className={`df-status-banner df-status-banner-${submitFeedback.type} animate-fade-in`}
              role="status"
            >
              {submitFeedback.type === 'success' ? (
                <CheckCircle2 size={18} className="flex-shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle size={18} className="flex-shrink-0" aria-hidden="true" />
              )}
              <span>{submitFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="df-login-form" noValidate>
            {/* Company Field (Company Slug) */}
            <Input
              id="df-input-companySlug"
              name="companySlug"
              label="Company"
              type="text"
              placeholder="e.g. acme-corp"
              value={formData.companySlug}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.companySlug}
              helperText="Enter your organization's unique slug"
              required
              disabled={isSubmitting}
              autoComplete="organization"
              startIcon={<Building2 size={18} />}
            />

            {/* Work Email Field */}
            <Input
              id="df-input-email"
              name="email"
              label="Work email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email}
              required
              disabled={isSubmitting}
              autoComplete="email"
              startIcon={<Mail size={18} />}
            />

            {/* Password Field with Visibility Toggle */}
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              startIcon={<Lock size={18} />}
            />

            {/* Options Row: Remember Me + Forgot Password */}
            <div className="df-form-options">
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                label="Remember me"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <a
                href="#forgot-password"
                className="df-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password recovery will be available with the full auth flow.');
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Primary Submit Button with Loading State */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              loadingText="Signing in..."
              disabled={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          {/* Footer link: Don't have an account? Create account */}
          <footer className="df-form-footer">
            <span>Don't have an account?</span>
            <Link to="/signup" className="df-signup-link">
              Create account
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
