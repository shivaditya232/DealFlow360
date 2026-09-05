import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * CustomerProfileMenu
 * Dropdown for the customer avatar/name in the topbar.
 * Logout uses the centralized AuthContext logout function.
 */
function CustomerProfileMenu({ customer, onNavigate, onClose }) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: 0,
      width: '200px',
      backgroundColor: '#0d1324',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '10px',
      boxShadow: '0 20px 40px -8px rgba(0,0,0,0.6)',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {/* Customer info row */}
      <div style={{
        padding: '0.875rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          fontSize: '0.8125rem',
          fontWeight: '600',
          color: '#f1f5f9',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {customer?.name || 'Customer'}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#475569',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginTop: '0.125rem',
        }}>
          {customer?.email || ''}
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '0.375rem' }}>
        <MenuAction
          icon={User}
          label="Profile"
          onClick={() => { onNavigate('profile'); onClose(); }}
        />
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '0.375rem 0' }} />
        <MenuAction
          icon={LogOut}
          label="Sign out"
          danger
          onClick={onClose} // will call logout via parent
        />
      </div>
    </div>
  );
}

function MenuAction({ icon: Icon, label, onClick, danger }) {
  const [hovered, setHovered] = useState(false);
  const color = danger ? '#ef4444' : hovered ? '#f1f5f9' : '#94a3b8';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '0.5rem 0.625rem',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: hovered ? (danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)') : 'transparent',
        cursor: 'pointer',
        color,
        fontSize: '0.8125rem',
        fontWeight: '500',
        textAlign: 'left',
        transition: 'all 130ms ease',
      }}
    >
      <Icon size={14} strokeWidth={1.75} />
      {label}
    </button>
  );
}

/**
 * CustomerTopbar
 * 
 * Renders:
 * - Hamburger toggle for sidebar (mobile/tablet)
 * - Page title
 * - Notification icon (placeholder — no notification endpoint yet)
 * - Customer avatar + name + dropdown (Profile / Logout)
 */
export default function CustomerTopbar({ title, onToggleSidebar, sidebarOpen }) {
  const { customer, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initials = customer?.name
    ? customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header style={{
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      backgroundColor: '#080f1f',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      gap: '1rem',
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Left: hamburger + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '7px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        <h1 style={{
          fontSize: '0.9375rem',
          fontWeight: '700',
          color: '#f1f5f9',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </h1>
      </div>

      {/* Right: notification + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Notification bell — placeholder, no backend endpoint */}
        <button
          aria-label="Notifications"
          title="Notifications (coming soon)"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)',
            backgroundColor: 'transparent',
            color: '#475569',
            cursor: 'default',
            position: 'relative',
          }}
        >
          <Bell size={16} strokeWidth={1.75} />
        </button>

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            id="customer-profile-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.3rem 0.5rem 0.3rem 0.375rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: menuOpen ? 'rgba(255,255,255,0.06)' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6875rem',
              fontWeight: '700',
              color: '#fff',
              letterSpacing: '0.03em',
              flexShrink: 0,
            }}>
              {initials}
            </div>

            {/* Customer name */}
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: '#cbd5e1',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {customer?.name || 'Customer'}
            </span>

            <ChevronDown
              size={13}
              color="#475569"
              style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
            />
          </button>

          {menuOpen && (
            <CustomerProfileMenu
              customer={customer}
              onNavigate={() => {}} // wire to portal view navigation if needed
              onClose={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
}
