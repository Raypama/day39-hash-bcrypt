(async function () {
  const API = "http://localhost:3000";

  // ============================
  // ✅ Refresh Token
  // ============================
  async function attemptRefresh() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;
      console.log("function attemptRefresh sukses!!!!");
      
      const data = await res.json();
      localStorage.setItem("accessToken", data.accessToken);
      return true;
    } catch (err) {
      console.error("Error refreshing token:", err);
      return false;
    }
  }

  // ============================
  // ✅ Check Login
  // ============================
  async function checkLogin() {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;

    try {
      const res = await fetch(`${API}/auth/check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
console.log("auth/check auth bearer token pertama sukses.");

      if (res.ok) return true;

      // refresh
      const refreshed = await attemptRefresh();
      if (!refreshed) return false;

      const newToken = localStorage.getItem("accessToken");
      const res2 = await fetch(`${API}/auth/check`, {
        headers: { Authorization: `Bearer ${newToken}` },
      });
      console.log("proses refres access token berhasil");
      
      return res2.ok;
    } catch (err) {
      console.error("Check login error:", err);
      return false;
    }
  }

  // ============================
  // ✅ Navbar Logic
  // ============================
  const authLink = document.getElementById("auth-link");
  const email = localStorage.getItem("email");
  const logged = await checkLogin();

  if (logged && email) {
    authLink.innerHTML = `
      <span class="text-blue-600 font-semibold">${email}</span>
      <button id="logoutBtn" class="ml-2 text-red-600 font-medium hover:text-red-800">
        Logout
      </button>
    `;
  } else {
    authLink.innerHTML = `
      <a href="/login.html" class="hover:text-blue-600">Login</a>
    `;
  }

  // ============================
  // ✅ Logout
  // ============================
  if (logged && email) {
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");

        await fetch(`${API}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      } finally {
        localStorage.clear();
        window.location.href = "/login.html";
      }
    });
  }
})();
