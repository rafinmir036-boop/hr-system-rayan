// ==========================================
// HR System - Main Application Logic
// File: js/app.js
// ==========================================

// Global State
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  // Check User Session
  const storedUser = localStorage.getItem("hr_user");
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
});

// 1. Single Page Navigation (Tab Switching)
function switchTab(tabName) {
  // Hide all tab content
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => tab.classList.add("hidden"));

  // Show selected tab
  const selectedTab = document.getElementById(`view-${tabName}`);
  if (selectedTab) {
    selectedTab.classList.remove("hidden");
  }

  // Update Navigation Active State
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => item.classList.remove("bg-slate-800", "text-white"));

  // Set Page Title
  const pageTitle = document.getElementById("page-title");
  if (pageTitle) {
    pageTitle.innerText = tabName.toUpperCase();
  }

  // Trigger Data Fetching based on tab
  switch (tabName) {
    case "dashboard":
      loadDashboardData();
      break;
    case "employees":
      fetchEmployees();
      break;
    case "increments":
      fetchIncrements();
      break;
    case "attendance":
      fetchTodayAttendance();
      break;
    case "leave":
      fetchLeaveRequests();
      break;
    default:
      break;
  }
}

// 2. Load Dashboard Summary Data
async function loadDashboardData() {
  try {
    const response = await fetch(`${CONFIG.API_URL}?action=getDashboardData`);
    const result = await response.json();

    if (result.status === "success") {
      document.getElementById("stat-total-emp").innerText = result.stats.totalEmployees || 0;
      document.getElementById("stat-present").innerText = result.stats.presentToday || 0;
      document.getElementById("stat-leave").innerText = result.stats.onLeave || 0;
      document.getElementById("stat-increment-due").innerText = result.stats.incrementDueCount || 0;
    }
  } catch (error) {
    console.error("Dashboard Load Error:", error);
  }
}

// 3. Fetch & Render Employees List
async function fetchEmployees() {
  const tbody = document.getElementById("employee-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>ডাটা লোড হচ্ছে...</td></tr>`;

  try {
    const response = await fetch(`${CONFIG.API_URL}?action=getEmployees`);
    const result = await response.json();

    if (result.status === "success" && result.employees.length > 0) {
      tbody.innerHTML = result.employees.map(emp => `
        <tr class="border-b hover:bg-gray-50 transition">
          <td class="p-3 font-semibold text-gray-700">${emp.id}</td>
          <td class="p-3">${emp.name}</td>
          <td class="p-3">${emp.branch}</td>
          <td class="p-3">${emp.department}</td>
          <td class="p-3">${emp.designation}</td>
          <td class="p-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${
              emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }">
              ${emp.status}
            </span>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">কোনো Employee ডাটা পাওয়া যায়নি।</td></tr>`;
    }
  } catch (error) {
    console.error("Employee Fetch Error:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-rose-500">ডাটা লোড করতে ব্যর্থ হয়েছে। API URL চেক করুন।</td></tr>`;
  }
}

// 4. Fetch Increment Due List (1 Year Completion)
async function fetchIncrements() {
  const tbody = document.getElementById("increment-table-body");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Increment চেক করা হচ্ছে...</td></tr>`;

  try {
    const response = await fetch(`${CONFIG.API_URL}?action=checkIncrementDue`);
    const result = await response.json();

    if (result.status === "success" && result.incrementDue.length > 0) {
      tbody.innerHTML = result.incrementDue.map(inc => `
        <tr class="border-b hover:bg-gray-50 transition">
          <td class="p-3 font-bold text-indigo-600">${inc.empId}</td>
          <td class="p-3 font-medium">${inc.name}</td>
          <td class="p-3">${inc.branch}</td>
          <td class="p-3 text-gray-600">${inc.lastIncrement}</td>
          <td class="p-3">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse">
              🔴 INCREMENT DUE
            </span>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">বর্তমানে কোনো Employee-এর Increment Due নেই।</td></tr>`;
    }
  } catch (error) {
    console.error("Increment Check Error:", error);
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-500">ডাটা লোড করতে ব্যর্থ হয়েছে।</td></tr>`;
  }
}

// 5. Placeholder functions for Attendance and Leave
async function fetchTodayAttendance() {
  console.log("Fetching attendance logs...");
}

async function fetchLeaveRequests() {
  console.log("Fetching leave requests...");
}
