import React from 'react'
import { useNavigate } from 'react-router-dom'

const variantStyles = {
  default: "bg-white text-black border border-gray-200",
  destructive: "bg-red-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-600 text-white"
}

export function toast({ 
  title, 
  description, 
  variant = "default", 
  duration = 3000,
  returnOnCancel = false 
}) {
  const toastContainer = document.getElementById('toast-container') || createToastContainer()
  const id = `toast-${Date.now()}`

  const toastElement = document.createElement('div')
  toastElement.id = id
  toastElement.className = `
    w-80 max-w-xs p-4 rounded-lg shadow-lg mb-4 flex items-start justify-between 
    ${variantStyles[variant]} 
    animate-in slide-in-from-right-full
  `

  toastElement.innerHTML = `
    <div class="flex-1 mr-3">
      ${title ? `<p class="text-sm font-medium">${title}</p>` : ''}
      ${description ? `<p class="text-xs opacity-90 mt-1">${description}</p>` : ''}
    </div>
    <button id="close-${id}" class="text-current opacity-50 hover:opacity-75">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `

  toastContainer.appendChild(toastElement)

  const closeButton = document.getElementById(`close-${id}`)
  closeButton.addEventListener('click', () => {
    removeToast(id, returnOnCancel)
  })

  // Auto remove
  setTimeout(() => removeToast(id, returnOnCancel), duration)

  return id  // Return toast ID for potential manual dismissal
}

function createToastContainer() {
  const container = document.createElement('div')
  container.id = 'toast-container'
  container.className = `
    fixed top-4 right-4 z-[1000] 
    flex flex-col items-end space-y-2
  `
  document.body.appendChild(container)
  return container
}

function removeToast(id, returnOnCancel = false) {
  const toastElement = document.getElementById(id)
  if (toastElement) {
    toastElement.classList.add('animate-out', 'fade-out', 'slide-out-to-right-full')
    setTimeout(() => {
      toastElement.remove()
      
      // Remove container if no toasts left
      const container = document.getElementById('toast-container')
      if (container && container.children.length === 0) {
        container.remove()
      }

      // Return to previous page if specified
      if (returnOnCancel) {
        window.history.back()
      }
    }, 300)
  }
}

// Convenience methods for different variants
toast.success = (options) => toast({ ...options, variant: 'success' })
toast.error = (options) => toast({ ...options, variant: 'destructive' })
toast.warning = (options) => toast({ ...options, variant: 'warning' })

// Method to manually dismiss a toast
toast.dismiss = (id, returnOnCancel = false) => {
  if (id) {
    removeToast(id, returnOnCancel)
  }
}