"use client";

export default function Header() {
  function logout() {
    localStorage.removeItem("admin_token");
    window.location.href = "/login";
  }

  return (
    <header className="bg-white shadow p-4 flex justify-between">
      <h2 className="font-bold">Admin Console</h2>

      <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </header>
  );
}
