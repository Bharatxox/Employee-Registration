function formatDate(isoDate) {
  if (!isoDate) return "-"; // handle null case
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function loadEmployees() {
  try {
    const res = await fetch("http://localhost:5000/api/employees");
    const employees = await res.json();
    console.log(employees);

    const tbody = document.querySelector("#employeeTable tbody");
    tbody.innerHTML = "";

    employees.forEach((emp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emp.employee_id}</td>
        <td>${emp.full_name}</td>
        <td>${emp.employee_code}</td>
        <td>${emp.unit_name}</td>
        <td>${emp.designation_name || "-"}</td>
        <td>${emp.department_name || "-"}</td>
        <td>${emp.company_name}</td>
        <td>${formatDate(emp.date_of_joining)}</td>
        <td>${emp.mobile_no}</td>
        <td>${emp.divisional_head_name}</td>
        <td>${emp.reporting_manager}</td>
        <td>${emp.reporting_manager_email}</td>
        <td>${emp.application_access}</td>
        <td>${emp.responsibility_in_oracle || "-"}</td>
        <td>${emp.options_in_ebiz || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading employees:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadEmployees);
