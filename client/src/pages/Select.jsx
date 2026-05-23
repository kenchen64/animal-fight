import { useNavigate } from "react-router-dom";

export default function Select() {
  const navigate = useNavigate();

  const choose = (animal) => {
    localStorage.setItem(
      "animal",
      animal
    );

    navigate("/game");
  };

  return (
    <div
      style={{
        background: "#111",
        color: "white",
        height: "100vh",
        textAlign: "center",
        paddingTop: "100px",
      }}
    >
      <h1>選擇動物</h1>

      <button
        onClick={() =>
          choose("dog")
        }
      >
        🐶 狗狗
      </button>

      <button
        onClick={() =>
          choose("cat")
        }
      >
        🐱 貓咪
      </button>

      <button
        onClick={() =>
          choose("fox")
        }
      >
        🦊 狐狸
      </button>
    </div>
  );
}
