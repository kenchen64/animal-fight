import { useState } from "react";

import axios from "axios";

export default function Login() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = async () => {
    const res = await axios.post(
      "https://animal-fight.onrender.com/auth/login",
      {
        username,
        password,
      }
    );

    localStorage.setItem(
      "token",
      res.data.token
    );

    localStorage.setItem(
      "username",
      username
    );

    window.location.href =
      "/select";
  };

  return (
    <div>
      <h1>玩家登入</h1>

      <input
        placeholder="帳號"
        onChange={(e) =>
          setUsername(
            e.target.value
          )
        }
      />

      <input
        type="password"
        placeholder="密碼"
        onChange={(e) =>
          setPassword(
            e.target.value
          )
        }
      />

      <button onClick={login}>
        登入
      </button>
    </div>
  );
}
