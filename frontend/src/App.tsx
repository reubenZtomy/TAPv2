import React, { useEffect, useState } from 'react'

export default function App() {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message || JSON.stringify(data)))
      .catch((err) => setMessage('Error: ' + String(err)))
  }, [])

  return (
    <div style={{fontFamily: 'sans-serif', padding: 24}}>
      <h1>TAP Frontend (TypeScript)</h1>
      <p>Message from backend:</p>
      <pre>{message}</pre>
    </div>
  )
}
