import { useState } from "react";

import axios from "axios";

import {
  Link,
  useNavigate,
} from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const login = async () => {
    try {
      const res = await axios.post(
        "https://你的後端.onrender.com/auth/login",
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

      navigate("/select");
    } catch (err) {
      alert("登入失敗");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#222",
      }}
    >
      <div
        style={{
          width: "300px",
          padding: "30px",
          background: "#333",
          borderRadius: "10px",
          color: "white",
        }}
      >
        <h1>動物大亂鬥</h1>

        <input
          placeholder="帳號"
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
          onChange={(e) =>
            setUsername(
              e.target.value
            )
          }
        />

        <input
          type="password"
          placeholder="密碼"
          style={{
            width: "100%",
            marginBottom: "10px",
          }}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          onClick={login}
          style={{
            width: "100%",
            height: "40px",
          }}
        >
          登入
        </button>

        <p>
          沒有帳號？
          <Link to="/register">
            註冊
          </Link>
        </p>
      </div>
    </div>
  );
}
