import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — Modern Dark Glassmorphism Select Dropdown
 * Hỗ trợ giao diện SRE cao cấp, hiệu ứng xoay chevron, click outside và tương thích ngược với onChange event.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  children,
  placeholder = 'Chọn một tùy chọn...',
  className = '',
  style = {},
  id,
  disabled = false,
  'aria-label': ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Chuẩn hóa options từ props.options hoặc từ children <option>
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
          return { value: String(opt.value), label: opt.label || opt.value, color: opt.color };
        }
        return { value: String(opt), label: String(opt) };
      });
    }

    if (children) {
      const opts = [];
      React.Children.forEach(children, child => {
        if (React.isValidElement(child) && child.type === 'option') {
          opts.push({
            value: String(child.props.value ?? child.props.children),
            label: child.props.children || child.props.value
          });
        }
      });
      return opts;
    }

    return [];
  }, [options, children]);

  const selectedOption = parsedOptions.find(o => String(o.value) === String(value));

  // Đóng khi click bên ngoài dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Đóng khi ấn Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Hỗ trợ cả 2 kiểu: e.target.value và val trực tiếp
      onChange({ target: { value: val, name: id } });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{
        position: 'relative',
        zIndex: isOpen ? 100 : 1,
        width: style.width || 'auto',
        ...style
      }}
      id={id}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="custom-select-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '40px',
          padding: '0.55rem 0.85rem',
          fontSize: '0.86rem',
          fontWeight: 500,
          borderRadius: '12px',
          border: isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
          background: 'var(--bg-input, var(--bg-card))',
          color: 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(6, 182, 212, 0.15)' : 'none',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          color="var(--text-secondary)"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="custom-select-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            minWidth: '100%',
            maxHeight: '240px',
            overflowY: 'auto',
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '4px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            animation: 'dropdownFadeIn 0.15s ease-out'
          }}
        >
          {parsedOptions.length === 0 ? (
            <div style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Không có tùy chọn
            </div>
          ) : (
            parsedOptions.map(opt => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.82rem',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'background 0.15s ease',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-input)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

