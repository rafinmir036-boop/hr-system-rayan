document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginCard = document.getElementById("login-card");
    const dashboard = document.getElementById("dashboard");
    const logoutBtn = document.getElementById("logout-btn");

    // ১. লগইন ফর্ম সাবমিট ইভেন্ট
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // পেজ যেন রিফ্রেশ না হয়

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        // Firebase Auth দিয়ে লগইন
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                alert("লগইন সফল হয়েছে!");
                showDashboard();
            })
            .catch((error) => {
                alert("লগইন ব্যর্থ হয়েছে: " + error.message);
                console.error("Login Error:", error);
            });
    });

    // ২. লগআউট ইভেন্ট
    logoutBtn.addEventListener("click", () => {
        auth.signOut().then(() => {
            alert("লগআউট করা হয়েছে।");
            showLogin();
        });
    });

    // ৩. লগইন স্টেট পর্যবেক্ষণ (User logged in আছে কি না চেক করা)
    auth.onAuthStateChanged((user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });

    // UI টগল ফাংশন
    function showDashboard() {
        loginCard.style.display = "none";
        dashboard.style.display = "block";
    }

    function showLogin() {
        loginCard.style.display = "block";
        dashboard.style.display = "none";
    }
});
