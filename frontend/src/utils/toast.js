import { useState, useEffect } from 'react';

const TOAST_DURATION = 3000; // 3 seconds

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <div className={`${bgColor} text-white px-4 py-2 rounded shadow-lg mb-2 flex justify-between items-center`}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 w-80">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, removeToast, ToastContainer };
};

// For direct usage in components without hooks
let toastRef = null;

export const toast = {
  success: (message) => toastRef?.showToast(message, 'success'),
  error: (message) => toastRef?.showToast(message, 'error'),
  warning: (message) => toastRef?.showToast(message, 'warning'),
  info: (message) => toastRef?.showToast(message, 'info'),
};

export const ToastProvider = ({ children }) => {
  const { showToast, ToastContainer } = useToast();
  
  // Set the toast ref for direct usage
  useEffect(() => {
    toastRef = { showToast };
    return () => {
      toastRef = null;
    };
  }, [showToast]);

  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
};
