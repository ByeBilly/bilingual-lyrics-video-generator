// This is a simplified version of the toast hook
// In a real project, you'd use a proper toast library like react-hot-toast or sonner

import { useState } from 'react'

type ToastVariant = 'default' | 'destructive'

interface ToastProps {
  title: string
  description: string
  variant?: ToastVariant
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, props])
    
    // Log to console for now
    console.log(`Toast: ${props.title} - ${props.description}`)
    
    // Remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t !== props))
    }, 3000)
  }

  return { toast, toasts }
}

