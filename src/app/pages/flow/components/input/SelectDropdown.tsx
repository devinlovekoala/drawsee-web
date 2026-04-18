import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  type: string;
}

interface SelectDropdownProps {
  options: DropdownOption[];
  selectedType: string;
  onSelect: (option: DropdownOption) => void;
  buttonLabel: string;
  dropdownTitle: string;
  buttonClassName?: string;
  dropdownClassName?: string;
}

export function SelectDropdown({
  options,
  selectedType,
  onSelect,
  buttonLabel,
  dropdownTitle,
  buttonClassName = "mode-selector-button shadow-[0_0_0_1px_rgba(0,0,0,0.1)]",
  dropdownClassName = "mode-dropdown animate-slide-in-bottom"
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(option => option.type === selectedType) || options[0];

  // 全局点击事件监听，用于关闭下拉菜单
  useEffect(() => {
    function handleGlobalClick(event: MouseEvent) {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    // 使用捕获阶段监听，确保在事件冒泡被阻止前捕获到事件
    window.addEventListener('click', handleGlobalClick, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (option: DropdownOption) => {
    onSelect(option);
    setIsOpen(false);
  };

  return (
    <div className={`mode-selector-wrapper ${isOpen ? 'open' : 'closed'}`}>
      <button 
        ref={buttonRef}
        className={buttonClassName}
        onClick={toggleDropdown}
      >
        <div className="mode-selector-icon-wrapper">
          {selectedOption.icon && <selectedOption.icon className="w-5 h-5" />}
        </div>
        <span className="mode-selector-text">{buttonLabel}</span>
        <ChevronDownIcon 
          className={`mode-selector-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={dropdownClassName}
          onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
        >
          <div className="mode-dropdown-content">
            <div className="mode-dropdown-header">
              <h3 className="mode-dropdown-title">{dropdownTitle}</h3>
            </div>
            <div className="mode-dropdown-body">
              {options.map((option) => (
                <div
                  key={option.type}
                  onClick={() => handleOptionSelect(option)}
                  className={`mode-option ${selectedType === option.type ? 'selected' : ''}`}
                >
                  <div className="mode-option-icon-wrapper">
                    {option.icon && <option.icon className="mode-option-icon" />}
                  </div>
                  <div className="mode-option-info">
                    <p className="mode-option-name">{option.name}</p>
                    <p className="mode-option-description">{option.description}</p>
                  </div>
                  {selectedType === option.type && (
                    <div className="mode-option-check">
                      <div className="mode-option-check-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mode-option-check-icon">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 