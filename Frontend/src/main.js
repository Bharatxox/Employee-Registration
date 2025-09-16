const API_BASE = "http://localhost:5000/api/options";
let employeeId = document.getElementById("employee_code").value || "";
let isNewMode = false; // Track state

function toggleTextarea() {
  const oracleBox = document.getElementById("oracle-box");
  const ebizBox = document.getElementById("ebiz-box");
  const empOptionsBox = document.getElementById("employee-options-box");
  const empCodeInput = document.getElementById("employee_code");
  const empIdInput = document.getElementById("employee_id_input");
  const newBtn = document.getElementById("new-emp-code");

  const selected = document.querySelector(
    'input[name="application_access"]:checked'
  ).value;

  newBtn.classList.add("green-btn");

  if (selected === "Oracle") {
    oracleBox.classList.remove("hidden");
    ebizBox.classList.add("hidden");
    empOptionsBox.style.display = "none";
  } else if (selected === "Ebiz") {
    ebizBox.classList.remove("hidden");
    oracleBox.classList.add("hidden");
    empOptionsBox.style.display = "block";
    // empIdInput.value = empCodeInput.value;

    // Load options dynamically here for the employee
    loadMainOptions(empIdInput.value);
  }
}

window.toggleTextarea = toggleTextarea;

async function submitForm(event) {
  event.preventDefault();

  const appAccess =
    document.querySelector('input[name="application_access"]:checked')?.value ||
    "";

  const fullName = document.getElementById("full_name").value;
  const employeeCode = document.getElementById("employee_code").value;
  const unitName = document.getElementById("unit_name").value;
  const dateOfJoining = document.getElementById("date_of_joining").value;
  const reportingManager = document.getElementById("reporting_manager").value;
  const reportingManagerEmail = document.getElementById(
    "reporting_manager_email"
  ).value;
  const mobileNo = document.getElementById("mobile_no").value;
  const selectedOption = appAccess;
  const oracleText = document.getElementById("oracle_textarea").value;
  // const ebizText = document.getElementById("ebiz_textarea").value;
  const inputEmployeeCode = document.getElementById("employee_id_input").value;
  const departmentId = document.getElementById("department").value;
  const designationId = document.getElementById("designation").value;
  const headId = document.getElementById("department_head").value;
  const companyId = document.getElementById("company").value;

  const data = {
    full_name: fullName,
    employee_code: employeeCode,
    unit_name: unitName,
    date_of_joining: dateOfJoining,
    mobile_no: mobileNo,
    application_access: selectedOption,
    responsibility_in_oracle: oracleText,
    options_in_ebiz: inputEmployeeCode,
    department_id: departmentId,
    designation_id: designationId,
    reporting_manager: reportingManager,
    reporting_manager_email: reportingManagerEmail,
    head_id: headId,
    company_id: companyId,
  };

  try {
    const response = await fetch("http://localhost:5000/api/employee", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    alert(result.message || "Employee added successfully!");

    if (response.ok) {
      document.getElementById("employeeForm").reset(); // clear all inputs
      const container = document.getElementById("options-container");
      container.innerHTML = "";

      const newBtn = document.getElementById("new-emp-code");
      const empIdInput = document.getElementById("employee_id_input");
      const searchBtn = document.getElementById("search-options-btn");
      const oracleBox = document.getElementById("oracle-box");
      const ebizBox = document.getElementById("ebiz-box");

      newBtn.textContent = "Add New";
      newBtn.classList.remove("red-btn");
      newBtn.classList.add("green-btn");
      searchBtn.disabled = false;
      searchBtn.classList.remove("disabled-btn");
      oracleBox.classList.add("hidden");
      ebizBox.classList.add("hidden");

      empIdInput.value = "";
      empIdInput.disabled = false;

      isNewMode = false; // ensure toggle state resets
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong!");
  }
}

document.getElementById("employeeForm").addEventListener("submit", submitForm);

async function loadDropdowns() {
  try {
    const deptSelect = document.getElementById("department");
    const desSelect = document.getElementById("designation");
    const deptHeadSelect = document.getElementById("department_head");
    const companySelect = document.getElementById("company");

    // Clear existing options except first
    deptSelect.length = 1;
    desSelect.length = 1;
    deptHeadSelect.length = 1;
    companySelect.length = 1;

    const [deptRes, desRes, deptHeadRes, companyRes] = await Promise.all([
      fetch("http://localhost:5000/api/departments"),
      fetch("http://localhost:5000/api/designations"),
      fetch("http://localhost:5000/api/department-heads"),
      fetch("http://localhost:5000/api/companies"),
    ]);

    if (!deptRes.ok || !desRes.ok || !deptHeadRes.ok || !companyRes.ok) {
      throw new Error("Failed to fetch dropdown data");
    }

    const departments = await deptRes.json();
    const designations = await desRes.json();
    const departmentHeads = await deptHeadRes.json();
    const companies = await companyRes.json();

    console.log("Departments:", departments);
    console.log("Designations:", designations);
    console.log("Department Heads", departmentHeads);
    console.log("Compaines Name", companies);

    departments.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.department_id;
      opt.textContent = d.department_name;
      deptSelect.appendChild(opt);
    });

    designations.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.designation_id;
      opt.textContent = d.designation_name;
      desSelect.appendChild(opt);
    });

    departmentHeads.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.head_id;
      opt.textContent = d.head_name;
      deptHeadSelect.appendChild(opt);
    });

    companies.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.company_id;
      opt.textContent = d.company_name;
      companySelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Dropdown load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadDropdowns);

async function getDivisionHead(deptId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/department-heads/${deptId}`
    );
    if (!response.ok) {
      throw new Error("No head found");
    }

    const data = await response.json();

    const selectEl = document.getElementById("department_head");
    selectEl.innerHTML = ""; // clear previous options

    if (data.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No head available";
      selectEl.appendChild(opt);
      return;
    }

    // Loop through all heads
    data.forEach((head) => {
      const opt = document.createElement("option");
      opt.value = head.head_id;
      opt.textContent = head.head_name;
      selectEl.appendChild(opt);
    });
  } catch (err) {
    console.error("Error fetching division head:", err);
  }
}

document.getElementById("department").addEventListener("change", function () {
  const deptId = this.value;
  console.log(deptId);
  if (deptId) {
    getDivisionHead(deptId);
  }
});

async function addNewEmployeeCode() {
  const empIdInput = document.getElementById("employee_id_input");
  const empCode = empIdInput.value.trim();
  const newBtn = document.getElementById("new-emp-code");
  const searchBtn = document.getElementById("search-options-btn");

  if (!isNewMode) {
    // ✅ ADD NEW mode
    if (!empCode) {
      alert("Please enter Employee Code first!");
      return;
    }

    // 🔍 Step 1: Check if employee already exists
    try {
      const checkRes = await fetch(
        `http://localhost:5000/api/employees/${empCode}`
      );
      if (checkRes.ok) {
        alert("Employee already exists. Please use Search Options.");
        return;
      }
    } catch (err) {
      console.error("Error checking employee:", err);
      alert("Server error while checking employee");
      return;
    }

    // 🔹 Step 2: Insert new employee
    try {
      const response = await fetch(
        "http://localhost:5000/api/employee/minimal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_code: empCode }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert("Error: " + (data.error || "Something went wrong"));
        return;
      }

      alert(`New employee created: ${empCode}`);

      // ✅ Copy empCode into employee_id_input & disable input
      empIdInput.value = empCode;
      empIdInput.disabled = true;
      loadMainOptions(empCode);

      // ✅ Change button to Cancel
      newBtn.textContent = "Cancel";
      newBtn.classList.remove("green-btn");
      newBtn.classList.add("red-btn");
      isNewMode = true;

      // Disable Search
      searchBtn.disabled = true;
      searchBtn.classList.add("disabled-btn");
    } catch (err) {
      console.error("Error inserting employee:", err);
      alert("Failed to add employee");
    }
  } else {
    // ❌ CANCEL mode with confirmation
    const confirmDelete = confirm(
      `⚠️ This will remove Employee Code "${empCode}" and all its associated data.\n\nYou will need to create a new Employee Code again.\n\nDo you want to continue?`
    );

    if (confirmDelete) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/employees/${empCode}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          const errData = await res.json();
          alert("Failed to delete: " + (errData.error || "Unknown error"));
          return;
        }

        alert(`Employee Code "${empCode}" removed successfully.`);

        // Clear input + reset UI
        empIdInput.value = "";
        empIdInput.disabled = false;

        newBtn.textContent = "Add New";
        newBtn.classList.remove("red-btn");
        newBtn.classList.add("green-btn");
        isNewMode = false;

        searchBtn.disabled = false;
        searchBtn.classList.remove("disabled-btn");

        const container = document.getElementById("options-container");
        container.innerHTML = "";
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("Server error while deleting employee.");
      }
    } else {
      // ❌ User pressed Cancel in confirm → do nothing
      return;
    }
  }
}

document
  .getElementById("new-emp-code")
  .addEventListener("click", addNewEmployeeCode);
