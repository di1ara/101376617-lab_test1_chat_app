document.getElementById("signup-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;

  fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
  })
  .then((res) => res.json())
  .then((data) => {
      if (data.success) {
          localStorage.setItem("username", username);
          window.location.href = "/chat"; 
      } else {
          alert(data.message);
      }
  });
});
