import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Select({ 
  value, 
  onValueChange, 
  children, 
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (newValue) => {
    onValueChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-[180px] ${className}`}>
      <SelectTrigger 
        isOpen={isOpen} 
        onClick={handleToggle} 
        value={value} 
        children={children} 
      />
      {isOpen && (
        <SelectContent>
          {React.Children.map(children, (child) => (
            <SelectItem 
              value={child.props.value} 
              onSelect={() => handleSelect(child.props.value)}
            >
              {child.props.children}
            </SelectItem>
          ))}
        </SelectContent>
      )}
    </div>
  );
}

export function SelectTrigger({ 
  isOpen, 
  onClick, 
  value, 
  children,
  className = '' 
}) {
  const selectedChild = React.Children.toArray(children).find(
    (child) => child.props.value === value
  );

  return (
    <button 
      onClick={onClick}
      className={`
        w-full 
        flex 
        items-center 
        justify-between 
        px-3 
        py-2 
        border 
        border-gray-300 
        rounded-md 
        bg-white 
        text-sm 
        focus:outline-none 
        focus:ring-2 
        focus:ring-blue-500
        ${className}
      `}
    >
      <SelectValue>
        {selectedChild ? selectedChild.props.children : 'Select an option'}
      </SelectValue>
      <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
    </button>
  );
}

export function SelectContent({ children, className = '' }) {
  return (
    <div 
      className={`
        absolute 
        z-10 
        mt-1 
        w-full 
        bg-white 
        border 
        border-gray-300 
        rounded-md 
        shadow-lg 
        max-h-60 
        overflow-auto
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function SelectItem({ 
  value, 
  children, 
  onSelect,
  className = '' 
}) {
  return (
    <div 
      onClick={onSelect}
      className={`
        px-3 
        py-2 
        text-sm 
        cursor-pointer 
        hover:bg-gray-100
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function SelectValue({ children }) {
  return <span className="truncate">{children}</span>;
}