document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const loginCard = document.getElementById("login-card");
    const dashboard = document.getElementById("dashboard");
    const logoutBtn = document.getElementById("logout-btn");

    // ১. লগইন ফর্ম সাবমিট ইভেন্ট হ্যান্ডলার
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // ব্রাউজারের ডিফল্ট রিফ্রেশ বন্ধ করে

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!email || !password) {
                alert("দয়া করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।");
                return;
            }

            // Firebase Authentication দিয়ে সাইন ইন
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Logged in successfully:", userCredential.user);
                    showDashboard();
                })
                .catch((error) => {
                    console.error("Login Error:", error.code, error.message);
                    alert("লগইন ব্যর্থ হয়েছে: " + error.message);
                });
        });
    }

    // ২. লগআউট ইভেন্ট হ্যান্ডলার
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            auth.signOut().then(() => {
                alert("লগআউট সফল হয়েছে।");
                showLogin();
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });
    }

    // ৩. ইউজারের লগইন অবস্থা চেক করা (Auth State Listener)
    auth.onAuthStateChanged((user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });

    // UI টগল ফাংশনসমূহ
    function showDashboard() {
        if (loginCard) loginCard.style.display = "none";
        if (dashboard) dashboard.style.display = "block";
    }

    function showLogin() {
        if (loginCard) loginCard.style.display = "block";
        if (dashboard) dashboard.style.display = "none";
    }
});
