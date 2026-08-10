// =====================================================
// GLOBAL VARIABLES
// =====================================================

let currentUser = null;
let currentEmployee = null;


// =====================================================
// AUTH STATE
// =====================================================

auth.onAuthStateChanged(async (user) => {

  document.getElementById("loading-screen").style.display = "none";

  if (user) {

    currentUser = user;

    await loadUserProfile(user);

    showApplication();

    await loadDashboard();

  } else {

    showLogin();

  }

});


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

  document.getElementById("login-page")
    .classList.remove("hidden");

  document.getElementById("app")
    .classList.add("hidden");

}


// =====================================================
// SHOW APPLICATION
// =====================================================

function showApplication() {

  document.getElementById("login-page")
    .classList.add("hidden");

  document.getElementById("app")
    .classList.remove("hidden");

}


// =====================================================
// LOGIN
// =====================================================

async function loginUser() {

  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;

  const errorBox =
    document.getElementById("login-error");

  const button =
    document.getElementById("login-button");


  errorBox.classList.add("hidden");


  if (!email || !password) {

    errorBox.textContent =
      "Please enter email and password.";

    errorBox.classList.remove("hidden");

    return;
  }


  button.disabled = true;

  button.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Logging in...';


  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

  } catch (error) {

    console.error(error);

    errorBox.textContent =
      getFirebaseError(error);

    errorBox.classList.remove("hidden");

  }


  button.disabled = false;

  button.innerHTML =
    '<i class="fa-solid fa-right-to-bracket mr-2"></i> Login';

}


// =====================================================
// FIREBASE ERROR
// =====================================================

function getFirebaseError(error) {

  switch (error.code) {

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/user-not-found":
      return "User not found.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-credential":
      return "Invalid email or password.";

    case "auth/too-many-requests":
      return "Too many login attempts. Try again later.";

    default:
      return error.message || "Login failed.";

  }

}


// =====================================================
// LOAD USER PROFILE
// =====================================================

async function loadUserProfile(user) {

  try {

    const snapshot =
      await db
        .collection("Employees")
        .where("email", "==", user.email)
        .limit(1)
        .get();


    if (!snapshot.empty) {

      const doc =
        snapshot.docs[0];

      currentEmployee = {
        id: doc.id,
        ...doc.data()
      };


      document.getElementById(
        "user-display-name"
      ).textContent =
        currentEmployee.name || "User";


      document.getElementById(
        "user-display-role"
      ).textContent =
        currentEmployee.designation ||
        currentEmployee.role ||
        "Employee";


    } else {

      document.getElementById(
        "user-display-name"
      ).textContent =
        user.email;


      document.getElementById(
        "user-display-role"
      ).textContent =
        "User";

    }

  } catch (error) {

    console.error(
      "Profile loading error:",
      error
    );

  }

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  try {

    await auth.signOut();

  } catch (error) {

    console.error(error);

    alert("Logout failed.");

  }

}


// =====================================================
// TAB SWITCH
// =====================================================

function switchTab(tab) {

  const contents =
    document.querySelectorAll(".tab-content");

  contents.forEach((content) => {

    content.classList.add("hidden");

  });


  const target =
    document.getElementById(
      `view-${tab}`
    );

  if (target) {

    target.classList.remove("hidden");

  }


  const navItems =
    document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {

    item.classList.remove("active");

  });


  event?.currentTarget?.classList.add("active");


  const titles = {

    dashboard: "Dashboard",

    employees: "Employees",

    attendance: "Attendance",

    leave: "Leave Management",

    payroll: "Payroll",

    increments: "Increment Due"

  };


  document.getElementById(
    "page-title"
  ).textContent =
    titles[tab] || "HR System";


  // Load data when opening tab

  if (tab === "employees") {

    loadEmployees();

  }

  if (tab === "attendance") {

    loadAttendance();

  }

  if (tab === "leave") {

    loadLeaves();

  }

  if (tab === "payroll") {

    loadPayroll();

  }

  if (tab === "increments") {

    loadIncrementDue();

  }

}


// =====================================================
// DASHBOARD
// =====================================================

async function loadDashboard() {

  try {

    const employeesSnapshot =
      await db
        .collection("Employees")
        .get();


    document.getElementById(
      "stat-total-emp"
    ).textContent =
      employeesSnapshot.size;


    let incrementDue = 0;


    const today =
      new Date();


    employeesSnapshot.forEach((doc) => {

      const employee =
        doc.data();


      if (employee.lastIncrement) {

        const lastIncrement =
          new Date(
            employee.lastIncrement
          );


        const diff =
          today - lastIncrement;


        const days =
          diff / (
            1000 *
            60 *
            60 *
            24
          );


        if (days >= 365) {

          incrementDue++;

        }

      }

    });


    document.getElementById(
      "stat-increment-due"
    ).textContent =
      incrementDue;


    await loadTodayAttendance();

    await loadTodayLeave();


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

  }

}


// =====================================================
// EMPLOYEES
// =====================================================

async function loadEmployees() {

  const tbody =
    document.getElementById(
      "employee-table-body"
    );


  tbody.innerHTML = `

    <tr>
      <td colspan="6"
          class="p-5 text-center text-gray-400">

        <i class="fa-solid fa-spinner fa-spin mr-2"></i>

        Loading employees...

      </td>
    </tr>

  `;


  try {

    const snapshot =
      await db
        .collection("Employees")
        .orderBy("employeeId")
        .get();


    tbody.innerHTML = "";


    if (snapshot.empty) {

      tbody.innerHTML = `

        <tr>
          <td colspan="6"
              class="p-5 text-center text-gray-400">

            No employees found.

          </td>
        </tr>

      `;

      return;

    }


    snapshot.forEach((doc) => {

      const employee =
        doc.data();


      const status =
        employee.status || "active";


      const statusClass =
        status.toLowerCase() === "active"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700";


      const row =
        document.createElement("tr");


      row.className =
        "border-b hover:bg-gray-50";


      row.innerHTML = `

        <td class="p-3 font-medium">
          ${escapeHtml(
            employee.employeeId || doc.id
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            employee.name || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            employee.branch || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            employee.department || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            employee.designation || "-"
          )}
        </td>

        <td class="p-3">

          <span
            class="px-2 py-1 rounded-full
                   text-xs font-semibold
                   ${statusClass}"
          >

            ${escapeHtml(status)}

          </span>

        </td>

      `;


      tbody.appendChild(row);

    });


  } catch (error) {

    console.error(error);

    tbody.innerHTML = `

      <tr>
        <td colspan="6"
            class="p-5 text-center text-red-500">

          Error loading employees.

        </td>
      </tr>

    `;

  }

}


// =====================================================
// ATTENDANCE
// =====================================================

async function loadAttendance() {

  const tbody =
    document.getElementById(
      "attendance-table-body"
    );


  tbody.innerHTML = `

    <tr>
      <td colspan="4"
          class="p-5 text-center text-gray-400">

        Loading attendance...

      </td>
    </tr>

  `;


  try {

    const snapshot =
      await db
        .collection("Attendance")
        .orderBy("date", "desc")
        .limit(100)
        .get();


    tbody.innerHTML = "";


    snapshot.forEach((doc) => {

      const data =
        doc.data();


      const row =
        document.createElement("tr");


      row.className =
        "border-b";


      row.innerHTML = `

        <td class="p-3">
          ${escapeHtml(
            data.employeeId || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.name || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.date || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.status || "-"
          )}
        </td>

      `;


      tbody.appendChild(row);

    });


    if (snapshot.empty) {

      tbody.innerHTML = `

        <tr>
          <td colspan="4"
              class="p-5 text-center text-gray-400">

            No attendance records.

          </td>
        </tr>

      `;

    }


  } catch (error) {

    console.error(error);

  }

}


// =====================================================
// TODAY ATTENDANCE
// =====================================================

async function loadTodayAttendance() {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  try {

    const snapshot =
      await db
        .collection("Attendance")
        .where("date", "==", today)
        .where("status", "==", "Present")
        .get();


    document.getElementById(
      "stat-present"
    ).textContent =
      snapshot.size;

  } catch (error) {

    console.error(error);

    document.getElementById(
      "stat-present"
    ).textContent =
      "0";

  }

}


// =====================================================
// LEAVE
// =====================================================

async function loadLeaves() {

  const tbody =
    document.getElementById(
      "leave-table-body"
    );


  try {

    const snapshot =
      await db
        .collection("Leaves")
        .orderBy("from", "desc")
        .limit(100)
        .get();


    tbody.innerHTML = "";


    snapshot.forEach((doc) => {

      const data =
        doc.data();


      const row =
        document.createElement("tr");


      row.className =
        "border-b";


      row.innerHTML = `

        <td class="p-3">
          ${escapeHtml(
            data.name || data.employeeId || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.type || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.from || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.to || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.status || "Pending"
          )}
        </td>

      `;


      tbody.appendChild(row);

    });


    if (snapshot.empty) {

      tbody.innerHTML = `

        <tr>
          <td colspan="5"
              class="p-5 text-center text-gray-400">

            No leave records.

          </td>
        </tr>

      `;

    }


  } catch (error) {

    console.error(error);

  }

}


// =====================================================
// TODAY LEAVE
// =====================================================

async function loadTodayLeave() {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  try {

    const snapshot =
      await db
        .collection("Leaves")
        .where("from", "<=", today)
        .where("to", ">=", today)
        .where("status", "==", "Approved")
        .get();


    document.getElementById(
      "stat-leave"
    ).textContent =
      snapshot.size;


  } catch (error) {

    console.error(error);

    document.getElementById(
      "stat-leave"
    ).textContent =
      "0";

  }

}


// =====================================================
// PAYROLL
// =====================================================

async function loadPayroll() {

  const tbody =
    document.getElementById(
      "payroll-table-body"
    );


  try {

    const snapshot =
      await db
        .collection("Payroll")
        .limit(100)
        .get();


    tbody.innerHTML = "";


    snapshot.forEach((doc) => {

      const data =
        doc.data();


      const basic =
        Number(data.basicSalary || 0);


      const allowance =
        Number(data.allowance || 0);


      const deduction =
        Number(data.deduction || 0);


      const net =
        basic +
        allowance -
        deduction;


      const row =
        document.createElement("tr");


      row.className =
        "border-b";


      row.innerHTML = `

        <td class="p-3">
          ${escapeHtml(
            data.employeeId || "-"
          )}
        </td>

        <td class="p-3">
          ${escapeHtml(
            data.name || "-"
          )}
        </td>

        <td class="p-3">
          ৳${basic.toLocaleString()}
        </td>

        <td class="p-3">
          ৳${allowance.toLocaleString()}
        </td>

        <td class="p-3">
          ৳${deduction.toLocaleString()}
        </td>

        <td class="p-3 font-bold text-indigo-600">
          ৳${net.toLocaleString()}
        </td>

      `;


      tbody.appendChild(row);

    });


    if (snapshot.empty) {

      tbody.innerHTML = `

        <tr>
          <td colspan="6"
              class="p-5 text-center text-gray-400">

            No payroll records.

          </td>
        </tr>

      `;

    }


  } catch (error) {

    console.error(error);

  }

}


// =====================================================
// INCREMENT DUE
// =====================================================

async function loadIncrementDue() {

  const tbody =
    document.getElementById(
      "increment-table-body"
    );


  tbody.innerHTML = "";


  try {

    const snapshot =
      await db
        .collection("Employees")
        .get();


    let dueCount = 0;


    snapshot.forEach((doc) => {

      const employee =
        doc.data();


      if (!employee.lastIncrement) {
        return;
      }


      const lastIncrement =
        new Date(
          employee.lastIncrement
        );


      const today =
        new Date();


      const difference =
        today - lastIncrement;


      const days =
        difference /
        (
          1000 *
          60 *
          60 *
          24
        );


      if (days >= 365) {

        dueCount++;


        const row =
          document.createElement("tr");


        row.className =
          "border-b";


        row.innerHTML = `

          <td class="p-3">
            ${escapeHtml(
              employee.employeeId || doc.id
            )}
          </td>

          <td class="p-3">
            ${escapeHtml(
              employee.name || "-"
            )}
          </td>

          <td class="p-3">
            ${escapeHtml(
              employee.branch || "-"
            )}
          </td>

          <td class="p-3">
            ${escapeHtml(
              employee.lastIncrement
            )}
          </td>

          <td class="p-3">

            <span
              class="px-2 py-1
                     rounded-full
                     bg-red-100
                     text-red-700
                     text-xs font-semibold"
            >
              Increment Due
            </span>

          </td>

        `;


        tbody.appendChild(row);

      }

    });


    document.getElementById(
      "stat-increment-due"
    ).textContent =
      dueCount;


    if (dueCount === 0) {

      tbody.innerHTML = `

        <tr>
          <td colspan="5"
              class="p-5 text-center text-gray-400">

            No increment due.

          </td>
        </tr>

      `;

    }


  } catch (error) {

    console.error(error);

  }

}


// =====================================================
// ADD EMPLOYEE
// =====================================================

function openAddEmployee() {

  alert(
    "Employee form will be connected to Firestore in the next step."
  );

}


// =====================================================
// LEAVE FORM
// =====================================================

function openLeaveForm() {

  alert(
    "Leave application form will be connected to Firestore in the next step."
  );

}


// =====================================================
// HTML SECURITY
// =====================================================

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }


  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}
