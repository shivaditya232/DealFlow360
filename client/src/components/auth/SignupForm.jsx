import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PasswordInput from '../ui/PasswordInput';
import AccountTypeSelector from './AccountTypeSelector';
import PasswordStrength from './PasswordStrength';
import { useAuth } from '../../context/AuthContext';
import { validateSignupForm, validateSignupField } from '../../validators/auth.validator';

export default function SignupForm({ onSubmitSuccess }) {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    companySlug: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleKey: null,
    accountType: null,
    role: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedData);

    // Auto-clear field error if user corrects it to valid according to Zod
    if (errors[name]) {
      const fieldError = validateSignupField(name, value, updatedData);
      if (!fieldError) {
        setErrors((prev) => ({
          ...prev,
          [name]: '',
        }));
      }
    }

    // If changing password, also revalidate confirmPassword if it had an error
    if (name === 'password' && errors.confirmPassword && formData.confirmPassword) {
      if (formData.confirmPassword === value) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: '',
        }));
      }
    }

    if (submitFeedback) {
      setSubmitFeedback(null);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateSignupField(name, value, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleRoleSelect = ({ key, accountType, role }) => {
    const updatedData = {
      ...formData,
      roleKey: key,
      accountType,
      role,
    };

    setFormData(updatedData);

    if (errors.roleKey) {
      const roleError = validateSignupField('roleKey', key, updatedData);
      if (!roleError) {
        setErrors((prev) => ({
          ...prev,
          roleKey: '',
        }));
      }
    }

    if (submitFeedback) {
      setSubmitFeedback(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validate entire form with Zod schema
    const { isValid, errors: validationErrors } = validateSignupForm(formData);

    if (!isValid) {
      setErrors(validationErrors);

      // Focus first invalid field for accessibility
      const firstKey = Object.keys(validationErrors)[0];
      const targetElementId = 
        firstKey === 'password' ? 'password' :
        firstKey === 'confirmPassword' ? 'confirmPassword' :
        firstKey === 'roleKey' ? 'role-selector-label' :
        `df-input-${firstKey}`;

      const el = document.getElementById(targetElementId);
      if (el) {
        if (typeof el.focus === 'function') el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitFeedback(null);

    // Prepare payload aligned with backend Prisma / Zod contract
    // IMPORTANT: Never trim or mutate the user's password!
    const payload = {
      name: formData.fullName.trim(),
      companySlug: formData.companySlug.trim().toLowerCase(),
      email: formData.email.trim(),
      password: formData.password,
      accountType: formData.accountType,
      role: formData.role || undefined,
    };

    try {
      const response = await signup(payload);

      const destination = response.landing === 'PORTAL' ? '/portal' : '/dashboard';
      const destinationName = response.landing === 'PORTAL' ? 'Customer Portal' : 'Dashboard';

      setSubmitFeedback({
        type: 'success',
        message: `Account created successfully. Redirecting to ${destinationName}...`,
      });

      if (onSubmitSuccess) {
        onSubmitSuccess(response);
      }

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (err) {
      const status = err.response ? err.response.status : null;
      const backendError = err.response?.data?.error;
      const validationDetails = err.response?.data?.details;

      let message = 'Registration request could not be completed. Please try again.';

      if (status === 409) {
        message = backendError || 'A company with this identifier already exists. Please choose a different company identifier.';
        if (backendError && (backendError.toLowerCase().includes('company') || backendError.toLowerCase().includes('workspace') || backendError.toLowerCase().includes('slug'))) {
          setErrors((prev) => ({ ...prev, companySlug: backendError }));
        } else if (backendError && backendError.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: backendError }));
        }
      } else if (status === 404) {
        message = backendError || 'Company not found';
        setErrors((prev) => ({ ...prev, companySlug: message }));
      } else if (status === 400) {
        message = backendError || 'Validation failed';
        if (validationDetails?.fieldErrors) {
          const fieldIssues = Object.entries(validationDetails.fieldErrors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('; ');
          if (fieldIssues) message += ` (${fieldIssues})`;
        }
      } else if (status === 429) {
        message = backendError || 'Too many attempts. Please try again later.';
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
    <div className="df-form-container df-signup-form-container">
      <header className="df-form-header df-signup-form-header">
        <h1 className="df-form-title df-signup-form-title">Create your account</h1>
        <p className="df-form-subtitle df-signup-form-subtitle">Set up your DealFlow360 workspace access.</p>
      </header>

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

      <form onSubmit={handleSubmit} className="df-signup-form" noValidate>
        {/* Full Name */}
        <Input
          id="df-input-fullName"
          name="fullName"
          label="Full name"
          placeholder="e.g. Navikesh"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.fullName}
          required
          disabled={isSubmitting}
          autoComplete="name"
          startIcon={<User size={18} />}
        />

        {/* Company */}
        <Input
          id="df-input-companySlug"
          name="companySlug"
          label="Company"
          placeholder="e.g. my-new-company"
          helperText="Unique identifier for your company"
          value={formData.companySlug}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.companySlug}
          required
          disabled={isSubmitting}
          autoComplete="organization"
          startIcon={<Building2 size={18} />}
        />

        {/* Work Email */}
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

        {/* Password with eye toggle & Strength Indicator */}
        <div className="df-password-field-group">
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            required
            disabled={isSubmitting}
            autoComplete="new-password"
            startIcon={<Lock size={18} />}
          />
          {/* Password strength meter and requirements */}
          <PasswordStrength password={formData.password} />
        </div>

        {/* Confirm Password with eye toggle */}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.confirmPassword}
          required
          disabled={isSubmitting}
          autoComplete="new-password"
          startIcon={<Lock size={18} />}
        />

        {/* Role & Account Type Selector */}
        <AccountTypeSelector
          value={formData.roleKey}
          onChange={handleRoleSelect}
          error={errors.roleKey}
          disabled={isSubmitting}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingText="Creating account..."
          disabled={isSubmitting}
          className="df-signup-submit-btn"
        >
          Create account
        </Button>
      </form>

      {/* Footer: Already have an account? Sign in */}
      <footer className="df-form-footer">
        <span>Already have an account?</span>
        <Link to="/login" className="df-signup-link">
          Sign in
        </Link>
      </footer>
    </div>
  );
}
