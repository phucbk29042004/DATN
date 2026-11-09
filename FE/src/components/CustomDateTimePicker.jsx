import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check, RotateCcw } from 'lucide-react';

/**
 * Modern Enterprise Custom Date & Time Picker
 * ============================================
 * Thay thế hoàn toàn picker native mặc định của trình duyệt:
 * - Giao diện SaaS tinh tế, bo góc mềm mại (rounded-2xl)
 * - Tương thích hoàn hảo cả Chế độ Sáng (Light) và Tối (Dark)
 * - Hỗ trợ chọn Ngày (Calendar Grid) và Giờ (24-Hour System)
 * - Nút xóa nhanh, nút "Bây giờ" và nút "Áp dụng"
 */
export default function CustomDateTimePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày & giờ...',
  lang = 'vi',
  align = 'left'
}) {
  const isVi = lang === 'vi';
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Chuyển đổi chuỗi ISO/Local string sang đối tượng Date an toàn
  const parseValue = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const initialDate = parseValue(value);
  const [viewDate, setViewDate] = useState(() => initialDate || new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState(() => initialDate);
  const [hour, setHour] = useState(() => initialDate ? initialDate.getHours() : new Date().getHours());
  const [minute, setMinute] = useState(() => initialDate ? initialDate.getMinutes() : 0);

  // Đồng bộ khi prop `value` thay đổi từ bên ngoài (ví dụ bấm chip chọn nhanh 1h, 24h, 7d)
  useEffect(() => {
    const d = parseValue(value);
    setTempSelectedDate(d);
    if (d) {
      setViewDate(d);
      setHour(d.getHours());
      setMinute(d.getMinutes());
    }
  }, [value]);

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Đóng popover khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sunday, 1: Monday...
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Tạo mảng ngày cho lưới lịch 7 cột
  const days = [];
  // Các ngày cuối tháng trước
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isOutside: true
    });
  }
  // Các ngày của tháng hiện tại
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isOutside: false
    });
  }
  // Các ngày đầu tháng sau để lấp đầy lưới
  const totalCells = Math.ceil(days.length / 7) * 7;
  const remaining = (totalCells < 35 ? 35 : totalCells) - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isOutside: true
    });
  }

  const handleSelectDay = (item) => {
    const newDate = new Date(item.year, item.month, item.day);
    setTempSelectedDate(newDate);
    if (item.isOutside) {
      setViewDate(new Date(item.year, item.month, 1));
    }
  };

  const handleApply = (e) => {
    e.stopPropagation();
    const d = tempSelectedDate || new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(hour);
    const min = pad(minute);
    const isoString = `${y}-${m}-${day}T${h}:${min}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setTempSelectedDate(null);
    setIsOpen(false);
  };

  const handleNow = (e) => {
    e.stopPropagation();
    const now = new Date();
    setTempSelectedDate(now);
    setViewDate(now);
    setHour(now.getHours());
    setMinute(now.getMinutes());
  };

  const weekDays = isVi
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthNames = isVi
    ? ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const formatDisplay = () => {
    const d = parseValue(value);
    if (!d) return null;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isToday = (y, m, d) => {
    const today = new Date();
    return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  };

  const isSelected = (y, m, d) => {
    if (!tempSelectedDate) return false;
    return tempSelectedDate.getFullYear() === y && tempSelectedDate.getMonth() === m && tempSelectedDate.getDate() === d;
  };

  const displayText = formatDisplay();

  return (
    <div className={`modern-datepicker-container ${isOpen ? 'is-active' : ''}`} ref={containerRef}>
      {/* Input Trigger Button */}
      <div
        className={`modern-datepicker-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(prev => !prev);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
          <Calendar size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.84rem',
              color: displayText ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: displayText ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {displayText || placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {displayText && (
            <button
              type="button"
              className="modern-datepicker-clear-btn"
              onClick={handleClear}
              title={isVi ? 'Xóa thời gian' : 'Clear date'}
              aria-label="Clear date"
            >
              <X size={12} />
            </button>
          )}
          <Clock size={13} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className={`modern-datepicker-popover ${align === 'right' ? 'align-right' : 'align-left'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Tháng / Năm & Nút chuyển tháng */}
          <div className="modern-datepicker-header">
            <button
              type="button"
              className="modern-datepicker-nav-btn"
              onClick={prevMonth}
              title={isVi ? 'Tháng trước' : 'Previous month'}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="modern-datepicker-month-title">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              className="modern-datepicker-nav-btn"
              onClick={nextMonth}
              title={isVi ? 'Tháng sau' : 'Next month'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Hàng nhãn Thứ (Su, Mo, Tu...) */}
          <div className="modern-datepicker-weekdays">
            {weekDays.map((wd, i) => (
              <span key={i} className="modern-datepicker-weekday-label">
                {wd}
              </span>
            ))}
          </div>

          {/* Lưới các ngày trong tháng */}
          <div className="modern-datepicker-calendar-grid">
            {days.map((item, idx) => {
              const selected = isSelected(item.year, item.month, item.day);
              const today = isToday(item.year, item.month, item.day);
              return (
                <button
                  key={idx}
                  type="button"
                  className={`modern-datepicker-day-cell ${item.isOutside ? 'is-outside' : ''} ${selected ? 'is-selected' : ''} ${today && !selected ? 'is-today' : ''}`}
                  onClick={() => handleSelectDay(item)}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Phân cách nhẹ */}
          <div className="modern-datepicker-divider" />

          {/* Bộ chọn Thời Gian (24 Giờ & Phút) */}
          <div className="modern-datepicker-time-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isVi ? 'Thời gian:' : 'Time:'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select
                className="modern-datepicker-select"
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
              <select
                className="modern-datepicker-select"
                value={minute}
                onChange={(e) => setMinute(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const m = idx * 5;
                  return (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick time chips */}
          <div className="modern-datepicker-time-chips">
            <button
              type="button"
              className="modern-datepicker-chip is-accent"
              onClick={handleNow}
            >
              <RotateCcw size={10} />
              {isVi ? 'Hiện tại' : 'Now'}
            </button>
          </div>

          {/* Footer nút Thao Tác (Xóa & Áp dụng) */}
          <div className="modern-datepicker-footer">
            <button
              type="button"
              className="btn btn-outline btn-sm modern-datepicker-action-btn"
              onClick={handleClear}
            >
              {isVi ? 'Xóa' : 'Clear'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm modern-datepicker-action-btn"
              onClick={handleApply}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Check size={13} />
              {isVi ? 'Áp dụng' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

