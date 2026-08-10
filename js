// ==========================================
// HR SYSTEM - FIREBASE APPLICATION
// ==========================================

import { auth, db } from "../firebase/config.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.7.1/firebase-firestore.js";

// ==========================================
// GLOBAL DATA
// ==========================================

let employees = [];
let attendance = [];
let leaves = [];

let currentUser = null;

// ==========================================
// PAGE INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("HR System Started");

  setupNavigation();
  setupLogin();
});

// ==========================================
// FIREBASE AUTH STATE
// ==========================================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    currentUser = user;

    console.log("Logged in:", user.email);

    showDashboard();

    await loadEmployees();
    await loadAttendance();
    await loadLeaves();

    updateDashboard();

  } else {

    currentUser = null;

    showLogin();
  }

});

// ==========================================
// LOGIN
// ==========================================

function setupLogin() {

  const loginForm = document.getElementById("login-form");

  if (!loginForm) {
    console.log("Login form not found.");
    return;
  }

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const loginInput =
      document.getElementById("login-email");

    const passwordInput =
      document.getElementById("login-password");

    const errorBox =
      document.getElementById("login-error");

    const button =
      document.getElementById("login-button");

    if (!loginInput || !passwordInput) {
      return;
    }

    const loginValue =
      loginInput.value.trim();

    const password =
      passwordInput.value;

    try {

      if (button) {
        button.disabled = true;
        button.innerText = "Signing in...";
      }

      if (errorBox) {
        errorBox.innerText = "";
      }

      let email = loginValue;

      // ------------------------------------------
      // If user enters Employee ID instead of email
      // ------------------------------------------

      if (!loginValue.includes("@")) {

        const employeeQuery = query(
          collection(db, "Employees"),
          where("employeeId", "==", loginValue)
        );

        const snapshot =
          await getDocs(employeeQuery);

        if (snapshot.empty) {

          throw new Error(
            "Employee ID not found."
          );
        }

        const employeeData =
          snapshot.docs[0].data();

        if (!employeeData.email) {

          throw new Error(
            "This employee does not have an email."
          );
        }

        email = employeeData.email;
      }

      // ------------------------------------------
      // Firebase Login
      // ------------------------------------------

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log(
        "Login successful:",
        email
      );

    } catch (error) {

      console.error(
        "Login Error:",
        error
      );

      if (errorBox) {

        if (
          error.code === "auth/invalid-credential"
        ) {

          errorBox.innerText =
            "Invalid email/Employee ID or password.";

        } else if (
          error.message ===
          "Employee ID not found."
        ) {

          errorBox.innerText =
            "Employee ID not found.";

        } else {

          errorBox.innerText =
            error.message;
        }
      }

    } finally {

      if (button) {

        button.disabled = false;
        button.innerText = "লগইন করুন";

      }
    }

  });

}

// ==========================================
// LOGOUT
// ==========================================

window.logout = async function () {

  try {

    await signOut(auth);

    console.log("Logged out successfully.");

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }

};

// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

  const loginPage =
    document.getElementById("login-page");

  const appPage =
    document.getElementById("app-page");

  if (loginPage) {
    loginPage.classList.remove("hidden");
  }

  if (appPage) {
    appPage.classList.add("hidden");
  }

}

// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

  const loginPage =
    document.getElementById("login-page");

  const appPage =
    document.getElementById("app-page");

  if (loginPage) {
    loginPage.classList.add("hidden");
  }

  if (appPage) {
    appPage.classList.remove("hidden");
  }

  const userName =
    document.getElementById(
      "user-display-name"
    );

  const userRole =
    document.getElementById(
      "user-display-role"
    );

  if (userName) {

    userName.innerText =
      currentUser?.email || "User";

  }

  if (userRole) {

    userRole.innerText =
      "Administrator";

  }

}

// ==========================================
// NAVIGATION
// ==========================================

function setupNavigation() {

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".nav-item")
            .forEach(nav => {

              nav.classList.remove(
                "active"
              );

            });

          item.classList.add("active");

        }
      );

    });

}

// ==========================================
// SWITCH TAB
// ==========================================

window.switchTab = function(tabName) {

  document
    .querySelectorAll(".tab-content")
    .forEach(view => {

      view.classList.add("hidden");

    });

  const selectedView =
    document.getElementById(
      `view-${tabName}`
    );

  if (selectedView) {

    selectedView.classList.remove(
      "hidden"
    );

  }

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.remove(
        "active"
      );

    });

  const clicked =
    document.querySelector(
      `[onclick="switchTab('${tabName}')"]`
    );

  if (clicked) {

    clicked.classList.add(
      "active"
    );

  }

  const titles = {

    dashboard: "Dashboard",
    employees: "Employees",
    attendance: "Attendance",
    leave: "Leave Management",
    payroll: "Payroll",
    increments: "Increment Due"

  };

  const title =
    document.getElementById(
      "page-title"
    );

  if (title) {

    title.innerText =
      titles[tabName] ||
      "HR System";

  }

  // Load specific views

  if (tabName === "employees") {
    renderEmployees();
  }

  if (tabName === "attendance") {
    renderAttendance();
  }

  if (tabName === "leave") {
    renderLeaves();
  }

  if (tabName === "increments") {
    renderIncrementDue();
  }

};

// ==========================================
// LOAD EMPLOYEES
// ==========================================

async function loadEmployees() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "Employees"
        )
      );

    employees = [];

    snapshot.forEach(
      documentSnapshot => {

        employees.push({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        });

      }
    );

    console.log(
      "Employees loaded:",
      employees
    );

    renderEmployees();

  } catch (error) {

    console.error(
      "Employee loading error:",
      error
    );

  }

}

// ==========================================
// LOAD ATTENDANCE
// ==========================================

async function loadAttendance() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "Attendance"
        )
      );

    attendance = [];

    snapshot.forEach(
      documentSnapshot => {

        attendance.push({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        });

      }
    );

    console.log(
      "Attendance loaded:",
      attendance
    );

  } catch (error) {

    console.error(
      "Attendance loading error:",
      error
    );

  }

}

// ==========================================
// LOAD LEAVES
// ==========================================

async function loadLeaves() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "Leaves"
        )
      );

    leaves = [];

    snapshot.forEach(
      documentSnapshot => {

        leaves.push({

          id:
            documentSnapshot.id,

          ...documentSnapshot.data()

        });

      }
    );

    console.log(
      "Leaves loaded:",
      leaves
    );

  } catch (error) {

    console.error(
      "Leave loading error:",
      error
    );

  }

}

// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard() {

  const total =
    document.getElementById(
      "stat-total-emp"
    );

  const present =
    document.getElementById(
      "stat-present"
    );

  const leave =
    document.getElementById(
      "stat-leave"
    );

  const increment =
    document.getElementById(
      "stat-increment-due"
    );

  // Total employees

  if (total) {

    total.innerText =
      employees.length;

  }

  // Today's date

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  // Present today

  const presentToday =
    attendance.filter(item => {

      return (
        item.date === today &&
        (
          item.status === "Present" ||
          item.status === "present"
        )
      );

    }).length;

  if (present) {

    present.innerText =
      presentToday;

  }

  // Leave today

  const leaveToday =
    leaves.filter(item => {

      return (
        item.date === today &&
        (
          item.status === "Approved" ||
          item.status === "approved"
        )
      );

    }).length;

  if (leave) {

    leave.innerText =
      leaveToday;

  }

  // Increment due

  const due =
    employees.filter(employee => {

      if (!employee.lastIncrement) {
        return false;
      }

      const last =
        new Date(
          employee.lastIncrement
        );

      const now =
        new Date();

      const difference =
        now.getTime() -
        last.getTime();

      const oneYear =
        365 *
        24 *
        60 *
        60 *
        1000;

      return (
        difference >= oneYear
      );

    }).length;

  if (increment) {

    increment.innerText =
      due;

  }

}

// ==========================================
// RENDER EMPLOYEES
// ==========================================

function renderEmployees() {

  const tbody =
    document.getElementById(
      "employee-table-body"
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  if (employees.length === 0) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="p-6 text-center text-gray-400">

          No employees found.

        </td>

      </tr>

    `;

    return;
  }

  employees.forEach(employee => {

    const row =
      document.createElement("tr");

    row.className =
      "border-b hover:bg-gray-50";

    row.innerHTML = `

      <td class="p-3 font-medium">
        ${employee.employeeId || employee.id}
      </td>

      <td class="p-3">
        ${employee.name || "-"}
      </td>

      <td class="p-3">
        ${employee.branch || "-"}
      </td>

      <td class="p-3">
        ${employee.department || "-"}
      </td>

      <td class="p-3">
        ${employee.designation || "-"}
      </td>

      <td class="p-3">

        <span class="
          px-2
          py-1
          rounded-full
          text-xs
          bg-emerald-100
          text-emerald-700
        ">

          ${employee.status || "Active"}

        </span>

      </td>

    `;

    tbody.appendChild(row);

  });

}

// ==========================================
// RENDER ATTENDANCE
// ==========================================

function renderAttendance() {

  const tbody =
    document.getElementById(
      "attendance-table-body"
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  if (attendance.length === 0) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="p-6 text-center text-gray-400">

          No attendance records found.

        </td>

      </tr>

    `;

    return;
  }

  attendance.forEach(item => {

    const row =
      document.createElement("tr");

    row.className =
      "border-b";

    row.innerHTML = `

      <td class="p-3">
        ${item.employeeId || "-"}
      </td>

      <td class="p-3">
        ${item.name || "-"}
      </td>

      <td class="p-3">
        ${item.date || "-"}
      </td>

      <td class="p-3">
        ${item.checkIn || "-"}
      </td>

      <td class="p-3">
        ${item.checkOut || "-"}
      </td>

      <td class="p-3">
        ${item.status || "-"}
      </td>

    `;

    tbody.appendChild(row);

  });

}

// ==========================================
// RENDER LEAVES
// ==========================================

function renderLeaves() {

  const tbody =
    document.getElementById(
      "leave-table-body"
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  if (leaves.length === 0) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="p-6 text-center text-gray-400">

          No leave records found.

        </td>

      </tr>

    `;

    return;
  }

  leaves.forEach(item => {

    const row =
      document.createElement("tr");

    row.className =
      "border-b";

    row.innerHTML = `

      <td class="p-3">
        ${item.employeeId || "-"}
      </td>

      <td class="p-3">
        ${item.name || "-"}
      </td>

      <td class="p-3">
        ${item.leaveType || "-"}
      </td>

      <td class="p-3">
        ${item.date || "-"}
      </td>

      <td class="p-3">
        ${item.status || "Pending"}
      </td>

    `;

    tbody.appendChild(row);

  });

}

// ==========================================
// RENDER INCREMENT DUE
// ==========================================

function renderIncrementDue() {

  const tbody =
    document.getElementById(
      "increment-table-body"
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  const now =
    new Date();

  const oneYear =
    365 *
    24 *
    60 *
    60 *
    1000;

  const dueEmployees =
    employees.filter(employee => {

      if (!employee.lastIncrement) {
        return false;
      }

      const last =
        new Date(
          employee.lastIncrement
        );

      return (
        now.getTime() -
        last.getTime()
      ) >= oneYear;

    });

  if (dueEmployees.length === 0) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="5"
          class="p-6 text-center text-gray-400">

          No increment due.

        </td>

      </tr>

    `;

    return;
  }

  dueEmployees.forEach(employee => {

    const row =
      document.createElement("tr");

    row.className =
      "border-b";

    row.innerHTML = `

      <td class="p-3">
        ${employee.employeeId || employee.id}
      </td>

      <td class="p-3">
        ${employee.name || "-"}
      </td>

      <td class="p-3">
        ${employee.branch || "-"}
      </td>

      <td class="p-3">
        ${employee.lastIncrement || "-"}
      </td>

      <td class="p-3">

        <span class="
          px-2
          py-1
          rounded-full
          bg-red-100
          text-red-700
          text-xs
          font-semibold
        ">

          Increment Due

        </span>

      </td>

    `;

    tbody.appendChild(row);

  });

}

// ==========================================
// ADD EMPLOYEE
// ==========================================

window.addEmployee = async function(employeeData) {

  try {

    const docRef =
      await addDoc(
        collection(
          db,
          "Employees"
        ),
        employeeData
      );

    console.log(
      "Employee added:",
      docRef.id
    );

    await loadEmployees();

    updateDashboard();

  } catch (error) {

    console.error(
      "Add employee error:",
      error
    );

  }

};

// ==========================================
// DELETE EMPLOYEE
// ==========================================

window.deleteEmployee = async function(employeeId) {

  try {

    await deleteDoc(
      doc(
        db,
        "Employees",
        employeeId
      )
    );

    await loadEmployees();

    updateDashboard();

  } catch (error) {

    console.error(
      "Delete employee error:",
      error
    );

  }

};

// ==========================================
// ADD ATTENDANCE
// ==========================================

window.addAttendance = async function(data) {

  try {

    await addDoc(
      collection(
        db,
        "Attendance"
      ),
      data
    );

    await loadAttendance();

    updateDashboard();

  } catch (error) {

    console.error(
      "Attendance error:",
      error
    );

  }

};

// ==========================================
// ADD LEAVE
// ==========================================

window.addLeave = async function(data) {

  try {

    await addDoc(
      collection(
        db,
        "Leaves"
      ),
      data
    );

    await loadLeaves();

    updateDashboard();

  } catch (error) {

    console.error(
      "Leave error:",
      error
    );

  }

};

// ==========================================
// FIREBASE SYSTEM READY
// ==========================================

console.log(
  "Firebase HR System initialized successfully."
);
