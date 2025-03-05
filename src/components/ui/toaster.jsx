import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

const variantStyles = {
  default: "bg-white text-black border border-gray-200",
  destructive: "bg-red-600 text-white",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-600 text-white"
}

const Toaster = ({ toasts = [], onDismiss }) => {
  return (
    <div 
      aria-live="polite" 
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
    >
      <div className="w-full flex flex-col space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={cn(
              "w-full sm:w-96 max-w-xl shadow-lg rounded-lg pointer-events-auto overflow-hidden",
              variantStyles[toast.variant || "default"]
            )}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="ml-3 w-0 flex-1">
                  {toast.title && (
                    <p className="text-sm font-medium">
                      {toast.title}
                    </p>
                  )}
                  {toast.description && (
                    <p className="mt-1 text-sm opacity-90">
                      {toast.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { Toaster }