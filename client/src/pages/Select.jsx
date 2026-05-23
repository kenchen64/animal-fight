export default function Select() {
  const choose = (animal) => {
    localStorage.setItem(
      "animal",
      animal
    );

    window.location.href =
      "/";
  };

  return (
    <div>
      <h1>選擇角色</h1>

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