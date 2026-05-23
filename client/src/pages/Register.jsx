import { useState } from "react";

import axios from "axios";

import {
  Link,
  useNavigate,
} from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const register = async () => {
    try {
      await axios.post(
        "https://你的後端.onrender.com/auth/register",
        {
          username,
          password,
        }
      );

      alert("註冊成功");

      navigate("/login");
    } catch (err) {
      alert("註冊失敗");
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
        <h1>玩家註冊</h1>

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
          onClick={register}
          style={{
            width: "100%",
            height: "40px",
          }}
        >
          註冊
        </button>

        <p>
          已有帳號？
          <Link to="/login">
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
