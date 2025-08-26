'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const loginButtonRef = useRef<HTMLButtonElement>(null)

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth', { method: 'GET' })
        const data = await response.json()
        
        if (data.authenticated) {
          // User is already authenticated, redirect to home
          console.log('User already authenticated, redirecting to home.')
          
          // Get the "from" parameter if it exists
          const urlParams = new URLSearchParams(window.location.search)
          const fromPath = urlParams.get('from')
          
          // Redirect to the original destination or home
          const destination = fromPath && fromPath !== '/login' ? fromPath : '/'
          router.replace(destination)
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
      
      setIsLoading(false)
      // Focus first input after checking auth
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }

    checkAuthStatus()
  }, [router])

  const setCodeDigit = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase();
    setCode(newCode)

    // Auto-focus to next field or login button
    if (value && index < 5) {
      // Move to next input field
      inputRefs.current[index + 1]?.focus()
    } else if (value && index === 5) {
      // All fields filled, focus login button
      loginButtonRef.current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // If current field is empty and backspace is pressed, move to previous field
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleLogin = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'login', code: code.join('') }),
      })

      if (response.ok) {
        // Get the "from" parameter if it exists
        const urlParams = new URLSearchParams(window.location.search)
        const fromPath = urlParams.get('from')
        
        // Redirect to the original destination or home
        const destination = fromPath && fromPath !== '/login' ? fromPath : '/'
        router.replace(destination)
      } else {
        setErrorMessage(response.status === 401 ? 'Invalid access code' : 'Login failed')
        if (response.status === 401) {
          setCode(Array(6).fill(''))
          inputRefs.current[0]?.focus()
        }
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Login failed:', error)
      setErrorMessage('Login failed')
      setIsSubmitting(false)
    }
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginPrompt}>
        <h1>Login Page</h1>
        <p>Please log in to access the workshops. You can get the access code from a mentor.</p>
        <div className={styles.inputForm}>
          <input type="text" maxLength={1} value={code[0]} onChange={(e) => setCodeDigit(0, e.target.value)} onKeyDown={(e) => handleKeyDown(0, e)} ref={(el) => { inputRefs.current[0] = el }} />
          <input type="text" maxLength={1} value={code[1]} onChange={(e) => setCodeDigit(1, e.target.value)} onKeyDown={(e) => handleKeyDown(1, e)} ref={(el) => { inputRefs.current[1] = el }} />
          <input type="text" maxLength={1} value={code[2]} onChange={(e) => setCodeDigit(2, e.target.value)} onKeyDown={(e) => handleKeyDown(2, e)} ref={(el) => { inputRefs.current[2] = el }} />
          <input type="text" maxLength={1} value={code[3]} onChange={(e) => setCodeDigit(3, e.target.value)} onKeyDown={(e) => handleKeyDown(3, e)} ref={(el) => { inputRefs.current[3] = el }} />
          <input type="text" maxLength={1} value={code[4]} onChange={(e) => setCodeDigit(4, e.target.value)} onKeyDown={(e) => handleKeyDown(4, e)} ref={(el) => { inputRefs.current[4] = el }} />
          <input type="text" maxLength={1} value={code[5]} onChange={(e) => setCodeDigit(5, e.target.value)} onKeyDown={(e) => handleKeyDown(5, e)} ref={(el) => { inputRefs.current[5] = el }} />
        </div>
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <button
          ref={loginButtonRef}
          onClick={handleLogin}
          disabled={isSubmitting}
          className={styles.loginButton}
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </div>
    </div>
  )
}