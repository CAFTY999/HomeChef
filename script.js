const BASE_URL = "http://127.0.0.1:5000";

// ---------------- REGISTER ----------------
async function register() {
    const data = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value,
        specialization: document.getElementById("specialization").value
    };

    const res = await fetch(BASE_URL + "/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.msg);
}

// ---------------- LOGIN ----------------
async function login() {
    const data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    const res = await fetch(BASE_URL + "/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.token) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("role", result.role);

        // redirect based on role
        if (result.role === "patient") window.location = "patient.html";
        else if (result.role === "doctor") window.location = "doctor.html";
        else if (result.role === "lab") window.location = "lab.html";
        else window.location = "receptionist.html";
    } else {
        alert(result.msg);
    }
}