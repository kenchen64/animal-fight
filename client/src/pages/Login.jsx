import { useState } from 'react'
import axios from 'axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const login = async () => {
    const res = await axios.post(
      './pages/login',
      {
        username,
        password
      }
    )

    localStorage.setItem(
      'token',
      res.data.token
    )
    localStorage.setItem(
      'username',
      username
    )

    window.location.href = '/'
  }

  return (
    <div>
      <h1>Login</h1>

      <input
        placeholder='username'
        onChange={e => setUsername(e.target.value)}
      />

      <input
        type='password'
        placeholder='password'
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={login}>
        Login
      </button>
    </div>
  )
}
