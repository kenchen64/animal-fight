import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";

import Register from "./pages/Register";

import Select from "./pages/Select";

import Game from "./pages/Game";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/select"
          element={<Select />}
        />

        <Route
          path="/"
          element={<Game />}
        />
      </Routes>
    </BrowserRouter>
  );
}
