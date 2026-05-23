import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Select from "./pages/Select";
import Game from "./pages/Game";

export default function App() {
  const token =
    localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>

        {/* 登入 */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* 註冊 */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* 選角色 */}
        <Route
          path="/select"
          element={
            token ? (
              <Select />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 遊戲 */}
        <Route
          path="/game"
          element={
            token ? (
              <Game />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 預設導向 */}
        <Route
          path="*"
          element={
            <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
