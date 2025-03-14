import React from 'react'

const AlertDialog = ({ 
  open, 
  onOpenChange, 
  children 
}) => {
  if (!open) return null;

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {React.Children.map(children, child => 
          React.cloneElement(child, { 
            onClose: handleClose 
          })
        )}
      </div>
    </div>
  );
};

const AlertDialogContent = ({ children, onClose, className }) => (
  <div className={`p-6 ${className}`}>
    {React.Children.map(children, child => 
      React.cloneElement(child, { onClose })
    )}
  </div>
);

const AlertDialogHeader = ({ children, onClose, className }) => (
  <div className={`mb-4 ${className}`}>
    {React.Children.map(children, child => 
      React.cloneElement(child, { onClose })
    )}
  </div>
);

const AlertDialogFooter = ({ children, onClose, className }) => (
  <div className={`flex justify-end space-x-2 mt-4 ${className}`}>
    {React.Children.map(children, child => 
      React.cloneElement(child, { onClose })
    )}
  </div>
);

const AlertDialogCancel = ({ children, onClick, onClose, className }) => {
  const handleCancel = () => {
    if (onClick) {
      onClick();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <button
      onClick={handleCancel}
      className={`px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 ${className}`}
    >
      {children || 'Cancel'}
    </button>
  );
};

const AlertDialogAction = ({ children, onClick, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${className}`}
  >
    {children || 'Confirm'}
  </button>
);

const AlertDialogTitle = ({ children, className }) => (
  <h2 className={`text-xl font-semibold ${className}`}>
    {children}
  </h2>
);

const AlertDialogDescription = ({ children, className }) => (
  <p className={`text-gray-600 ${className}`}>
    {children}
  </p>
);

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
};