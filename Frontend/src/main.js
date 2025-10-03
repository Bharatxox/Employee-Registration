const API_BASE = "http://localhost:5000/api";
let employeeId = document.getElementById("employee_code")?.value || "";
let isNewMode = false;

// Global data stores
let allUnits = [];
let allDepartments = [];
let allDesignations = [];
let allDepartmentHeads = []; // This will store ALL department heads initially
let filteredDepartmentHeads = []; // This will store filtered heads based on department
let allCompanies = [];

// Track validation states
let validSelections = {
  unit: false,
  department: false,
  designation: false,
  department_head: false,
};

// Store autocomplete instances for dynamic updates
let autocompleteInstances = {};

// Initialize when DOM loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded - initializing autocompletes");
  loadAllData();
});

// Load all data from APIs
async function loadAllData() {
  try {
    console.log("Loading data from APIs...");

    const [unitsRes, deptRes, desRes, headsRes] = await Promise.all([
      fetch("http://localhost:5000/api/units"),
      fetch("http://localhost:5000/api/departments"),
      fetch("http://localhost:5000/api/designations"),
      fetch("http://localhost:5000/api/department-heads"),
    ]);

    if (unitsRes.ok) allUnits = await unitsRes.json();
    if (deptRes.ok) allDepartments = await deptRes.json();
    if (desRes.ok) allDesignations = await desRes.json();
    if (headsRes.ok) {
      allDepartmentHeads = await headsRes.json();
      filteredDepartmentHeads = [...allDepartmentHeads]; // Start with all heads
    }

    console.log("Data loaded successfully:", {
      units: allUnits.length,
      departments: allDepartments.length,
      designations: allDesignations.length,
      heads: allDepartmentHeads.length,
    });

    // Initialize autocompletes after data is loaded
    initializeAllAutocompletes();
    loadCompaniesDropdown();
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

// Initialize all autocomplete fields
function initializeAllAutocompletes() {
  console.log("Initializing autocomplete fields...");

  const fields = [
    {
      name: "unit",
      searchId: "unit_search",
      dropdownId: "unit_dropdown",
      hiddenId: "unit_name",
      data: allUnits,
      displayField: "unit_code",
      valueField: "unit_code",
    },
    {
      name: "department",
      searchId: "department_search",
      dropdownId: "department_dropdown",
      hiddenId: "department",
      data: allDepartments,
      displayField: "department_name",
      valueField: "department_id",
    },
    {
      name: "designation",
      searchId: "designation_search",
      dropdownId: "designation_dropdown",
      hiddenId: "designation",
      data: allDesignations,
      displayField: "designation_name",
      valueField: "designation_id",
    },
    {
      name: "department_head",
      searchId: "department_head_search",
      dropdownId: "department_head_dropdown",
      hiddenId: "department_head",
      data: filteredDepartmentHeads, // Use filtered data
      displayField: "head_name",
      valueField: "head_id",
    },
  ];

  fields.forEach((field) => {
    const searchInput = document.getElementById(field.searchId);
    const dropdown = document.getElementById(field.dropdownId);

    console.log(`Checking ${field.name}:`, {
      searchInput: !!searchInput,
      dropdown: !!dropdown,
    });

    if (searchInput && dropdown) {
      autocompleteInstances[field.name] = initializeAutocomplete(field);
      console.log(`✅ ${field.name} autocomplete initialized`);
    } else {
      console.error(`❌ ${field.name} elements not found`);
    }
  });
}

// Generic autocomplete function
function initializeAutocomplete(fieldConfig) {
  const {
    name,
    searchId,
    dropdownId,
    hiddenId,
    data,
    displayField,
    valueField,
  } = fieldConfig;

  const searchInput = document.getElementById(searchId);
  const hiddenInput = document.getElementById(hiddenId);
  const dropdown = document.getElementById(dropdownId);

  if (!searchInput || !dropdown) {
    console.error(`Elements not found for ${name}`);
    return;
  }

  console.log(`Initializing autocomplete for ${name}`);

  let currentFocus = -1;
  let currentData = data;

  // Function to update data dynamically
  const updateData = (newData) => {
    currentData = newData;
    console.log(`Updated data for ${name}:`, newData.length);
  };

  // Function to refresh dropdown
  const refreshDropdown = () => {
    if (dropdown.classList.contains("show")) {
      const currentSearch = searchInput.value;
      if (currentSearch) {
        searchItems(currentSearch);
      } else {
        showAllItems();
      }
    }
  };

  // Focus event - show all items when clicked
  searchInput.addEventListener("focus", function () {
    console.log(`${name} input focused`);
    showAllItems();
  });

  // Input event with debouncing
  let searchTimeout;
  searchInput.addEventListener("input", function (e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      console.log(`Searching ${name} for:`, e.target.value);
      searchItems(e.target.value);
      validSelections[name] = false; // Reset validation when user types
    }, 300);
  });

  // Blur event - validate input when leaving field
  searchInput.addEventListener("blur", function () {
    setTimeout(() => {
      if (!validSelections[name] && this.value !== "") {
        validateCurrentInput();
      }
    }, 200);
  });

  // Keyboard navigation
  searchInput.addEventListener("keydown", function (e) {
    const options = dropdown.getElementsByClassName("option-item");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentFocus = Math.min(currentFocus + 1, options.length - 1);
      highlightOption(options, currentFocus);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentFocus = Math.max(currentFocus - 1, -1);
      highlightOption(options, currentFocus);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1 && options[currentFocus]) {
        options[currentFocus].click();
      } else {
        validateCurrentInput();
      }
    } else if (e.key === "Escape") {
      dropdown.classList.remove("show");
      currentFocus = -1;
      if (!validSelections[name]) {
        searchInput.value = "";
        if (hiddenInput) hiddenInput.value = "";
      }
    }
  });

  // Validate current input
  function validateCurrentInput() {
    const currentValue = searchInput.value.trim();
    if (currentValue === "") return;

    const matchedItem = currentData.find(
      (item) => item[displayField] === currentValue
    );

    if (!matchedItem) {
      searchInput.value = "";
      if (hiddenInput) hiddenInput.value = "";
      alert(
        `Please select a valid ${name.replace(
          "_",
          " "
        )} from the dropdown list.`
      );
      searchInput.focus();
    } else {
      selectItem(matchedItem[valueField], matchedItem[displayField]);
    }
  }

  // Search items function
  function searchItems(searchTerm) {
    dropdown.innerHTML = "";

    if (!searchTerm) {
      showAllItems();
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filteredItems = currentData
      .filter((item) => item[displayField].toLowerCase().includes(searchLower))
      .slice(0, 15);

    if (filteredItems.length === 0) {
      const noResult = document.createElement("div");
      noResult.className = "option-item no-result";
      noResult.textContent = `No ${name.replace("_", " ")}s found`;
      noResult.style.color = "#ff4444";
      dropdown.appendChild(noResult);
    } else {
      filteredItems.forEach((item, index) => {
        addOptionItem(item, index);
      });
    }

    dropdown.classList.add("show");
    currentFocus = -1;
    console.log(`Showing ${filteredItems.length} results for ${name}`);
  }

  // Show all items function
  function showAllItems() {
    dropdown.innerHTML = "";
    const limitedItems = currentData.slice(0, 10);

    limitedItems.forEach((item, index) => {
      addOptionItem(item, index);
    });

    dropdown.classList.add("show");
    currentFocus = -1;
    console.log(`Showing all ${limitedItems.length} items for ${name}`);
  }

  // Add option item to dropdown
  function addOptionItem(item, index) {
    const option = document.createElement("div");
    option.className = "option-item";
    option.textContent = item[displayField];
    option.setAttribute("data-value", item[valueField]);

    option.addEventListener("click", () => {
      selectItem(item[valueField], item[displayField]);
    });

    option.addEventListener("mouseenter", () => {
      highlightOption(dropdown.getElementsByClassName("option-item"), index);
    });

    dropdown.appendChild(option);
  }

  // Select item
  function selectItem(value, displayText) {
    searchInput.value = displayText;
    if (hiddenInput) hiddenInput.value = value;
    dropdown.classList.remove("show");
    currentFocus = -1;
    validSelections[name] = true;

    console.log(`Selected ${name}:`, displayText);

    // Special handling for department selection
    if (name === "department") {
      getDivisionHead(value);
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      !e.target.closest(`#${searchId}`) &&
      !e.target.closest(`#${dropdownId}`)
    ) {
      dropdown.classList.remove("show");
      currentFocus = -1;

      // Validate input when clicking outside
      if (!validSelections[name] && searchInput.value !== "") {
        validateCurrentInput();
      }
    }
  });

  // Return functions for external control
  return {
    updateData,
    refreshDropdown,
    getCurrentData: () => currentData,
  };
}

// Get division head based on department selection
async function getDivisionHead(deptId) {
  try {
    console.log(`Fetching department heads for department ID: ${deptId}`);

    const response = await fetch(`${API_BASE}/department-heads/${deptId}`);
    if (!response.ok) {
      throw new Error("No head found");
    }

    const data = await response.json();
    console.log("Department heads data:", data);

    // Update the filtered department heads
    filteredDepartmentHeads = data;

    // Get department head autocomplete instance
    const deptHeadAutocomplete = autocompleteInstances.department_head;
    if (deptHeadAutocomplete) {
      deptHeadAutocomplete.updateData(filteredDepartmentHeads);
    }

    // Get department head elements
    const searchInput = document.getElementById("department_head_search");
    const hiddenInput = document.getElementById("department_head");

    // Clear current selection
    if (searchInput) searchInput.value = "";
    if (hiddenInput) hiddenInput.value = "";
    validSelections.department_head = false;

    // If dropdown is open, refresh it
    const dropdown = document.getElementById("department_head_dropdown");
    if (dropdown && dropdown.classList.contains("show")) {
      deptHeadAutocomplete.refreshDropdown();
    }

    console.log(
      `Updated department heads for department ${deptId}:`,
      data.length
    );

    // Show message if no heads available
    if (data.length === 0) {
      setTimeout(() => {
        alert(
          "No department heads available for this department. Please select a different department."
        );
      }, 100);
    }
  } catch (err) {
    console.error("Error fetching division head:", err);

    // Clear department head field on error
    const searchInput = document.getElementById("department_head_search");
    const hiddenInput = document.getElementById("department_head");

    if (searchInput) searchInput.value = "";
    if (hiddenInput) hiddenInput.value = "";

    validSelections.department_head = false;

    // Reset to all department heads
    filteredDepartmentHeads = [...allDepartmentHeads];
    const deptHeadAutocomplete = autocompleteInstances.department_head;
    if (deptHeadAutocomplete) {
      deptHeadAutocomplete.updateData(filteredDepartmentHeads);
    }
  }
}

// Highlight option during keyboard navigation
function highlightOption(options, index) {
  for (let i = 0; i < options.length; i++) {
    options[i].classList.remove("highlighted");
  }
  if (index > -1 && options[index]) {
    options[index].classList.add("highlighted");
    options[index].scrollIntoView({ block: "nearest" });
  }
}

// Load companies for the regular dropdown
async function loadCompaniesDropdown() {
  try {
    const companySelect = document.getElementById("company");
    if (!companySelect) {
      console.error("Company select element not found");
      return;
    }

    companySelect.innerHTML = '<option value="">Select Company</option>';

    const response = await fetch("http://localhost:5000/api/companies");
    if (!response.ok) throw new Error("Failed to fetch companies");

    allCompanies = await response.json();
    allCompanies.forEach((company) => {
      const opt = document.createElement("option");
      opt.value = company.company_id;
      opt.textContent = company.company_name;
      companySelect.appendChild(opt);
    });

    console.log("Companies loaded:", allCompanies.length);
  } catch (err) {
    console.error("Error loading companies:", err);
  }
}

// Submit form function with validation
async function submitForm(event) {
  event.preventDefault();

  // Validate all autocomplete fields
  const unitCode = document.getElementById("unit_name")?.value;
  const departmentId = document.getElementById("department")?.value;
  const designationId = document.getElementById("designation")?.value;
  const headId = document.getElementById("department_head")?.value;
  const dateOfJoining = document.getElementById("date_of_joining").value;

  // Validation checks
  if (!unitCode || !validSelections.unit) {
    alert("Please select a valid unit from the dropdown");
    document.getElementById("unit_search")?.focus();
    return;
  }
  if (!departmentId || !validSelections.department) {
    alert("Please select a valid department from the dropdown");
    document.getElementById("department_search")?.focus();
    return;
  }
  if (!designationId || !validSelections.designation) {
    alert("Please select a valid designation from the dropdown");
    document.getElementById("designation_search")?.focus();
    return;
  }
  if (!headId || !validSelections.department_head) {
    alert("Please select a valid department head from the dropdown");
    document.getElementById("department_head_search")?.focus();
    return;
  }
  if (!dateOfJoining) {
    alert("Please select a date of joining");
    document.getElementById("dateInput").focus();
    return;
  }

  // Additional validation to ensure valid selections
  const isValidUnit = allUnits.some((unit) => unit.unit_code === unitCode);
  const isValidDept = allDepartments.some(
    (dept) => dept.department_id == departmentId
  );
  const isValidDes = allDesignations.some(
    (des) => des.designation_id == designationId
  );
  const isValidHead = filteredDepartmentHeads.some(
    (head) => head.head_id == headId
  );

  if (!isValidUnit || !isValidDept || !isValidDes || !isValidHead) {
    alert("Please select valid options from all dropdowns.");
    return;
  }

  // Collect form data
  const appAccess =
    document.querySelector('input[name="application_access"]:checked')?.value ||
    "";
  const fullName = document.getElementById("full_name")?.value;
  const employeeCode = document.getElementById("employee_code")?.value;
  // const dateOfJoining = document.getElementById("date_of_joining")?.value;
  const reportingManager = document.getElementById("reporting_manager")?.value;
  const reportingManagerEmail = document.getElementById(
    "reporting_manager_email"
  )?.value;
  const mobileNo = document.getElementById("mobile_no")?.value;
  const employeeEmail = document.getElementById("employee_email")?.value;
  const oracleText = document.getElementById("oracle_textarea")?.value;
  const inputEmployeeCode = document.getElementById("employee_id_input")?.value;
  const companyId = document.getElementById("company")?.value;

  const data = {
    full_name: fullName,
    employee_code: employeeCode,
    unit_name: unitCode,
    date_of_joining: dateOfJoining,
    mobile_no: mobileNo,
    employee_email: employeeEmail,
    application_access: appAccess,
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
    const response = await fetch(`${API_BASE}/employee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    alert(result.message || "Employee added successfully!");

    if (response.ok) {
      resetForm();
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong!");
  }
}

// Reset form function
function resetForm() {
  // Reset all autocomplete fields
  const fields = [
    { search: "unit_search", hidden: "unit_name" },
    { search: "department_search", hidden: "department" },
    { search: "designation_search", hidden: "designation" },
    { search: "department_head_search", hidden: "department_head" },
  ];

  fields.forEach((field) => {
    const searchInput = document.getElementById(field.search);
    const hiddenInput = document.getElementById(field.hidden);
    if (searchInput) searchInput.value = "";
    if (hiddenInput) hiddenInput.value = "";
  });

  // Reset validation states
  validSelections = {
    unit: false,
    department: false,
    designation: false,
    department_head: false,
  };

  // Reset department heads to show all
  filteredDepartmentHeads = [...allDepartmentHeads];
  const deptHeadAutocomplete = autocompleteInstances.department_head;
  if (deptHeadAutocomplete) {
    deptHeadAutocomplete.updateData(filteredDepartmentHeads);
  }

  // Reset other form elements
  document.getElementById("employeeForm")?.reset();
  const container = document.getElementById("options-container");
  if (container) container.innerHTML = "";

  const newBtn = document.getElementById("new-emp-code");
  const empIdInput = document.getElementById("employee_id_input");
  const searchBtn = document.getElementById("search-options-btn");
  const oracleBox = document.getElementById("oracle-box");
  const ebizBox = document.getElementById("ebiz-box");

  if (newBtn) {
    newBtn.textContent = "Add New";
    newBtn.classList.remove("red-btn");
    newBtn.classList.add("green-btn");
  }
  if (empIdInput) {
    empIdInput.value = "";
    empIdInput.disabled = false;
  }
  if (searchBtn) {
    searchBtn.disabled = false;
    searchBtn.classList.remove("disabled-btn");
  }
  if (oracleBox) oracleBox.classList.add("hidden");
  if (ebizBox) ebizBox.classList.add("hidden");

  isNewMode = false;
}

// ==================== EXISTING FUNCTIONS (UNCHANGED) ====================

// Toggle textarea function
function toggleTextarea() {
  const oracleBox = document.getElementById("oracle-box");
  const ebizBox = document.getElementById("ebiz-box");
  const empOptionsBox = document.getElementById("employee-options-box");
  const empCodeInput = document.getElementById("employee_code");
  const empIdInput = document.getElementById("employee_id_input");
  const newBtn = document.getElementById("new-emp-code");

  const selected = document.querySelector(
    'input[name="application_access"]:checked'
  )?.value;

  if (newBtn) newBtn.classList.add("green-btn");

  if (selected === "Oracle") {
    if (oracleBox) oracleBox.classList.remove("hidden");
    if (ebizBox) ebizBox.classList.add("hidden");
    if (empOptionsBox) empOptionsBox.style.display = "none";
  } else if (selected === "Ebiz") {
    if (ebizBox) ebizBox.classList.remove("hidden");
    if (oracleBox) oracleBox.classList.add("hidden");
    if (empOptionsBox) empOptionsBox.style.display = "block";
    // if (empIdInput) loadMainOptions(empIdInput.value);
  }
}

// Add new employee code function
async function addNewEmployeeCode() {
  const empIdInput = document.getElementById("employee_id_input");
  const empCode = empIdInput ? empIdInput.value.trim() : "";
  const newBtn = document.getElementById("new-emp-code");
  const searchBtn = document.getElementById("search-options-btn");
  const copyBtn = document.getElementById("copy");

  if (!isNewMode) {
    if (!empCode) {
      alert("Please enter Employee Code first!");
      return;
    }

    try {
      const checkRes = await fetch(`${API_BASE}/employees/${empCode}`);
      if (checkRes.ok) {
        alert("Employee already exists. Please use Search Options.");
        return;
      }
    } catch (err) {
      console.error("Error checking employee:", err);
      alert("Server error while checking employee");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/employee/minimal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_code: empCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert("Error: " + (data.error || "Something went wrong"));
        return;
      }

      alert(`New employee created: ${empCode}`);

      if (empIdInput) {
        empIdInput.value = empCode;
        empIdInput.disabled = true;
        loadMainOptions(empCode);
      }

      if (newBtn) {
        newBtn.textContent = "Cancel";
        newBtn.classList.remove("green-btn");
        newBtn.classList.add("red-btn");
      }

      isNewMode = true;

      if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.classList.add("disabled-btn");
        copyBtn?.classList.add("disabled-btn");
      }
    } catch (err) {
      console.error("Error inserting employee:", err);
      alert("Failed to add employee");
    }
  } else {
    const confirmDelete = confirm(
      `⚠️ This will remove Employee Code "${empCode}" and all its associated data.\n\nYou will need to create a new Employee Code again.\n\nDo you want to continue?`
    );

    if (confirmDelete) {
      try {
        const res = await fetch(`${API_BASE}/employees/${empCode}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errData = await res.json();
          alert("Failed to delete: " + (errData.error || "Unknown error"));
          return;
        }

        alert(`Employee Code "${empCode}" removed successfully.`);

        if (empIdInput) {
          empIdInput.value = "";
          empIdInput.disabled = false;
        }

        if (newBtn) {
          newBtn.textContent = "Add New";
          newBtn.classList.remove("red-btn");
          newBtn.classList.add("green-btn");
        }

        isNewMode = false;

        if (searchBtn) {
          searchBtn.disabled = false;
          searchBtn.classList.remove("disabled-btn");
          copyBtn?.classList.remove("disabled-btn");
        }

        const container = document.getElementById("options-container");
        if (container) container.innerHTML = "";
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("Server error while deleting employee.");
      }
    }
  }
}

function CopyEmployeeCode() {
  const empCodeInput = document.getElementById("employee_code");
  if (empCodeInput && empCodeInput.value) {
    navigator.clipboard.writeText(empCodeInput.value).then(
      () => {
        document.getElementById("employee_id_input").value = empCodeInput.value;
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  } else {
    alert("No Employee Code to copy!");
  }
}

document.getElementById("copy")?.addEventListener("click", CopyEmployeeCode);

//===================== DATE PICKER LOGIC ====================

const input = document.getElementById("dateInput");
const dropdown = document.getElementById("dropdown");
const monthBox = document.getElementById("monthBox");
const yearBox = document.getElementById("yearBox");

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Populate Months
months.forEach((m, i) => {
  const div = document.createElement("div");
  div.classList.add("scroll-item");
  div.textContent = m;
  div.dataset.month = i;
  monthBox.appendChild(div);
});

// Populate Years (up to current year)
for (let y = currentYear; y >= 1970; y--) {
  const div = document.createElement("div");
  div.classList.add("scroll-item");
  div.textContent = y;
  div.dataset.year = y;
  yearBox.appendChild(div);
}

let selectedMonth = null;
let selectedYear = null;

// Event Listener: Open dropdown
input.addEventListener("click", (e) => {
  e.stopPropagation();
  const isVisible = dropdown.style.display === "flex";
  dropdown.style.display = isVisible ? "none" : "flex";
});

// Select Month
monthBox.addEventListener("click", (e) => {
  if (e.target.classList.contains("scroll-item")) {
    const monthIndex = +e.target.dataset.month;

    // Restrict months beyond current date
    if (selectedYear === currentYear && monthIndex > currentMonth) {
      return;
    }

    [...monthBox.children].forEach((c) => c.classList.remove("active"));
    e.target.classList.add("active");
    selectedMonth = monthIndex;
    updateInput();
  }
});

// Select Year
yearBox.addEventListener("click", (e) => {
  if (e.target.classList.contains("scroll-item")) {
    const yearValue = +e.target.dataset.year;

    [...yearBox.children].forEach((c) => c.classList.remove("active"));
    e.target.classList.add("active");
    selectedYear = yearValue;

    // Reset month selection if invalid for selected year
    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      selectedMonth = null;
      [...monthBox.children].forEach((c) => c.classList.remove("active"));
    }

    updateInput();
  }
});

function updateInput() {
  if (selectedMonth !== null && selectedYear !== null) {
    // Update visible input (display format)
    input.value = `${months[selectedMonth]} ${selectedYear}`;

    // Update hidden input for form submission (MySQL DATE format: YYYY-MM-DD)
    // Always use 1st day of the month since we're only selecting month/year
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(
      2,
      "0"
    )}-01`;
    document.getElementById("date_of_joining").value = formattedDate;

    console.log("Date sent to database:", formattedDate); // For debugging

    dropdown.style.display = "none";
  }
}

// Close dropdown if clicked outside
document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target) && e.target !== input) {
    dropdown.style.display = "none";
  }
});

// Keyboard support
input.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    dropdown.style.display = "none";
  }
});

// Set current date as default
window.addEventListener("load", () => {
  selectedMonth = currentMonth;
  selectedYear = currentYear;

  const currentMonthElement = monthBox.querySelector(
    `[data-month="${currentMonth}"]`
  );
  const currentYearElement = yearBox.querySelector(
    `[data-year="${currentYear}"]`
  );

  if (currentMonthElement) currentMonthElement.classList.add("active");
  if (currentYearElement) currentYearElement.classList.add("active");

  updateInput();
});

async function handleCopyEmpCode() {
  const employeeId = document.getElementById("employee_code")?.value;
  const employeeInput = document.getElementById("employee_id_input");
  employeeInput.value = employeeId;
}

document
  .getElementById("employee_code")
  .addEventListener("change", handleCopyEmpCode);

// ==================== EVENT LISTENERS ====================

document.getElementById("employeeForm").addEventListener("submit", submitForm);
document
  .getElementById("new-emp-code")
  .addEventListener("click", addNewEmployeeCode);
window.toggleTextarea = toggleTextarea;

// Note: The department change event listener is now handled within the autocomplete selection
