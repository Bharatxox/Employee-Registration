const API_BASE = "http://localhost:5000/api/options";
let employeeId = document.getElementById("employee_code")?.value || "";
let isReadOnlyMode = false; // 🔹 global flag

async function loadMainOptions(employeeId, readOnly = false) {
  if (!employeeId) {
    console.warn("Employee ID is missing");
    return;
  }

  isReadOnlyMode = readOnly; // set mode globally

  try {
    const res = await fetch(`${API_BASE}/${employeeId}/main`);
    const mainOptions = await res.json();

    const container = document.getElementById("options-container");
    container.innerHTML = ""; // always reset

    for (let option of mainOptions) {
      const optionDiv = createOptionElement(option);
      container.appendChild(optionDiv);
    }
  } catch (err) {
    console.error("Error loading options:", err);
  }
}

function createOptionElement(option) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("option-wrapper");
  wrapper.dataset.optionId = option.option_id;
  wrapper.dataset.optionValue = option.value ?? "";

  const row = document.createElement("div");
  row.classList.add("option-row");

  const leftGroup = document.createElement("div");
  leftGroup.classList.add("left-group");

  const toggle = document.createElement("img");
  toggle.classList.add("toggle-icon");
  toggle.style.width = "16px";
  toggle.style.height = "16px";
  toggle.style.marginRight = "6px";

  const childrenContainer = document.createElement("div");
  childrenContainer.classList.add("sub-options");
  childrenContainer.style.display = "none";
  childrenContainer.style.marginLeft = "20px";

  if (option.is_leaf === 0) {
    toggle.src = "../../public/plus.svg";
    toggle.style.cursor = "pointer";

    toggle.addEventListener("click", async () => {
      if (childrenContainer.style.display === "none") {
        toggle.src = "../../public/minus.svg";
        row.classList.add("active");

        if (!childrenContainer.hasChildNodes()) {
          const parentEnabled = wrapper.dataset.optionValue === "Yes";
          await renderSubOptions(
            childrenContainer,
            option.option_id,
            parentEnabled
          );

          // 🔹 After children are loaded, disable them if read-only
          if (isReadOnlyMode) {
            disableAllRadios(childrenContainer);
          }
        }

        childrenContainer.style.display = "block";
      } else {
        toggle.src = "../../public/plus.svg";
        childrenContainer.style.display = "none";
        row.classList.remove("active");
      }
    });
  } else {
    toggle.src = "../../public/minus.svg";
    toggle.style.opacity = "0.4";
    toggle.style.cursor = "default";
  }

  const label = document.createElement("span");
  label.textContent = option.option_name;

  leftGroup.appendChild(toggle);
  leftGroup.appendChild(label);

  const rightGroup = document.createElement("div");
  rightGroup.classList.add("right-group");

  const yesRadio = document.createElement("input");
  yesRadio.type = "radio";
  yesRadio.name = `option-${option.option_id}`;
  yesRadio.value = "Yes";
  if (option.value === "Yes") yesRadio.checked = true;

  const noRadio = document.createElement("input");
  noRadio.type = "radio";
  noRadio.name = `option-${option.option_id}`;
  noRadio.value = "No";
  if (option.value === "No") noRadio.checked = true;

  if (isReadOnlyMode) {
    yesRadio.disabled = true;
    noRadio.disabled = true;
  } else {
    yesRadio.addEventListener("change", () => {
      wrapper.dataset.optionValue = "Yes";
      updateValue(option.option_id, "Yes");
      setChildrenState(childrenContainer, true);
    });

    noRadio.addEventListener("change", () => {
      wrapper.dataset.optionValue = "No";
      updateValue(option.option_id, "No");
      setChildrenState(childrenContainer, false);
    });
  }

  const yesLabel = document.createElement("label");
  yesLabel.textContent = "Yes";
  yesLabel.style.marginRight = "10px";
  yesLabel.prepend(yesRadio);

  const noLabel = document.createElement("label");
  noLabel.textContent = "No";
  noLabel.prepend(noRadio);

  rightGroup.appendChild(yesLabel);
  rightGroup.appendChild(noLabel);

  row.appendChild(leftGroup);
  row.appendChild(rightGroup);

  wrapper.appendChild(row);
  wrapper.appendChild(childrenContainer);

  // 🔹 If read-only mode → disable this whole option (including sub-options if already present)
  if (isReadOnlyMode) {
    disableAllRadios(wrapper);
  }

  return wrapper;
}

// Utility: disable all radios inside a container
function disableAllRadios(container) {
  const radios = container.querySelectorAll('input[type="radio"]');
  radios.forEach((radio) => {
    radio.disabled = true;
  });
}

// Render children of an option
async function renderSubOptions(container, parentId, parentEnabled = true) {
  try {
    employeeId = document.getElementById("employee_code")?.value;
    const res = await fetch(`${API_BASE}/${employeeId}/${parentId}/children`);
    const subOptions = await res.json();

    // clear container then add children
    container.innerHTML = "";

    for (let sub of subOptions) {
      const subDiv = createOptionElement(sub);
      container.appendChild(subDiv);
    }

    // If parent is disabled (No), immediately force children to No and disable them.
    if (!parentEnabled) {
      const wrappers = container.querySelectorAll(".option-wrapper");
      wrappers.forEach((wrapper) => {
        const optionId = wrapper.dataset.optionId;
        const prevValue = wrapper.dataset.optionValue;

        const yesRadio = wrapper.querySelector('input[value="Yes"]');
        const noRadio = wrapper.querySelector('input[value="No"]');

        if (!yesRadio || !noRadio) return;

        // Force No checked if not already
        if (!noRadio.checked) {
          noRadio.checked = true;
        }
        // Disable both radios
        yesRadio.disabled = true;
        noRadio.disabled = true;

        // If backend value wasn't already No, update it now and reflect in dataset
        if (prevValue !== "No") {
          updateValue(optionId, "No");
          wrapper.dataset.optionValue = "No";
        }

        // Recurse into next level and disable them as well
        const subContainer = wrapper.querySelector(".sub-options");
        if (subContainer) {
          // If children are not yet loaded they will be handled when loaded via renderSubOptions;
          // if they are loaded already, force-disable them now.
          setChildrenState(subContainer, false);
        }
      });
    } else {
      // Parent is enabled: ensure children radios are enabled (they should reflect server values)
      const wrappers = container.querySelectorAll(".option-wrapper");
      wrappers.forEach((wrapper) => {
        const yesRadio = wrapper.querySelector('input[value="Yes"]');
        const noRadio = wrapper.querySelector('input[value="No"]');
        if (yesRadio && noRadio) {
          yesRadio.disabled = false;
          noRadio.disabled = false;
        }
      });
    }
  } catch (err) {
    console.error("Error loading sub-options:", err);
  }
}

// Update value in backend
async function updateValue(optionId, value) {
  try {
    employeeId = document.getElementById("employee_id_input")?.value;
    await fetch(`${API_BASE}/${employeeId}/options/${optionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    console.log(`Updated option ${optionId} -> ${value}`);
  } catch (err) {
    console.error("Error updating value:", err);
  }
}

function setChildrenState(container, enabled) {
  if (!container) return;

  const wrappers = container.querySelectorAll(".option-wrapper");

  wrappers.forEach((wrapper) => {
    const optionId = wrapper.dataset.optionId;
    const yesRadio = wrapper.querySelector('input[value="Yes"]');
    const noRadio = wrapper.querySelector('input[value="No"]');

    if (!yesRadio || !noRadio) return;

    if (enabled) {
      // Enable editing for children; keep their current checked state
      yesRadio.disabled = false;
      noRadio.disabled = false;
      // Update wrapper dataset to reflect no forced change at this point
      // (child UI already reflects server value)
    } else {
      // Force children to No and disable them
      const wasAlreadyNo = noRadio.checked;
      if (!wasAlreadyNo) {
        noRadio.checked = true;
        yesRadio.checked = false;
      }
      yesRadio.disabled = true;
      noRadio.disabled = true;

      // Only update backend if child wasn't already No
      if (!wasAlreadyNo) {
        updateValue(optionId, "No");
        wrapper.dataset.optionValue = "No";
      }
    }

    // Recursively apply to deeper levels if any sub-container present
    const subContainer = wrapper.querySelector(".sub-options");
    if (subContainer) {
      setChildrenState(subContainer, enabled);
    }
  });
}

// Init
loadMainOptions();

document
  .getElementById("search-options-btn")
  .addEventListener("click", async () => {
    const empCode = document.getElementById("employee_id_input").value.trim();
    const optionsContainer = document.getElementById("options-container");

    if (!empCode) {
      alert("Please enter Employee Code");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/employees/${empCode}`);
      if (!res.ok) {
        const errorBox = `
          <div class="error-message">
            Employee Code <b>${empCode}</b> not found.<br>
            Try with a different Employee Code.
          </div>
        `;
        optionsContainer.innerHTML = errorBox;
        return;
      }

      const employee = await res.json();
      console.log("Found employee:", employee);

      optionsContainer.innerHTML = "";
      await loadMainOptions(empCode, true); // ✅ readOnly mode
    } catch (err) {
      console.error("Error checking employee:", err);
      alert("Server error while checking employee");
    }
  });

const empCodeInput = document.getElementById("employee_code");
const appAccessRadios = document.querySelectorAll(
  'input[name="application_access"]'
);

function setAppAccessDisabled(disabled) {
  appAccessRadios.forEach((radio) => {
    radio.disabled = disabled;
    if (disabled) radio.checked = false; // clear selection when disabled
  });
}

// ✅ disable at page load
setAppAccessDisabled(true);

// ✅ watch employee_code input changes
empCodeInput.addEventListener("input", () => {
  const code = empCodeInput.value.trim();
  if (code) {
    setAppAccessDisabled(false); // enable
  } else {
    setAppAccessDisabled(true); // disable again
  }
});

// document.getElementById("employee_code").addEventListener("input", () => {
//   const empCodeValue = document.getElementById("employee_code").value.trim();
//   const empIdInput = document.getElementById("employee_id_input");

//   empIdInput.value = empCodeValue; // mirror value in real-time
// });

window.addEventListener("DOMContentLoaded", () => {
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.removeAttribute("class"); // remove all CSS classes
  optionsContainer.style = ""; // reset inline styles too
});

document.getElementById("search-options-btn").addEventListener("click", () => {
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.classList.add("options-container"); // bring back styling
});

document.getElementById("new-emp-code").addEventListener("click", () => {
  const optionsContainer = document.getElementById("options-container");
  optionsContainer.classList.add("options-container"); // bring back styling
});
