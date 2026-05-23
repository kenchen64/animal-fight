import { useState } from "react";

import axios from "axios";

export default function Register() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const register = async () => {
    await axios.post(
      "https://animal-fight.onrender.com/auth/register",
      {
        username,
        password,
      }
    );

    alert("註冊成功");

    window.location.href =
      "/login";
  };

  return (
    <div>
      <h1>玩家註冊</h1>

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

      <button onClick={register}>
        註冊
      </button>
    </div>
  );
}