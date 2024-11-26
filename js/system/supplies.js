import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", async () => {
    try {
      const response = await fetch(`${backendURL}/api/logout`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        localStorage.clear();
        successNotification("Logout Successful.");
        window.location.pathname = "/"; // Redirect to home after logout
      } else {
        const json = await response.json();
        errorNotification(`Logout failed: ${json.message}`, 10);
      }
    } catch (error) {
      errorNotification("An error occurred during logout: " + error.message);
    }
  });
}

// Function to display tables based on type (medicine/equipment)
function showTable(type) {
  if (type === "medicine") {
    document.getElementById("medicine_table").classList.remove("d-none");
    document.getElementById("equipment_table").classList.add("d-none");
    document.getElementById("add_medicine_button").style.display =
      "inline-block";
    document.getElementById("add_equipment_button").style.display = "none";
  } else if (type === "equipment") {
    document.getElementById("medicine_table").classList.add("d-none");
    document.getElementById("equipment_table").classList.remove("d-none");
    document.getElementById("add_medicine_button").style.display = "none";
    document.getElementById("add_equipment_button").style.display =
      "inline-block";
  }
}

// Initial call to show the medicine table on load
document.addEventListener("DOMContentLoaded", function () {
  showTable("medicine"); // Show the medicine table by default
  getMedicine(); // Fetch and display data for the medicine table
});

// Fetch and display medicine data
async function getMedicine(query = "", order = "asc") {
  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#medicine_table tbody");

  tableBody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

  try {
    const response = await fetch(
      `${backendURL}/api/medicine?search=${query}&order=${order}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const json = await response.json();
      let tableContent = json
        .map(
          (medicine) => `
                <tr>
                    <td>${medicine.medicine_id}</td>
                    <td>${medicine.name}</td>
                    <td>${medicine.usage_description}</td>
                    <td>${medicine.quantity}</td>
                    <td>${medicine.expiration_date}</td>
                    <td>${medicine.batch_no}</td>
                    <td>${medicine.location}</td>
                    <td>${medicine.medicine_status}</td>
                    <td><button class="btn btn-warning btn-sm edit-btn" data-id="${medicine.medicine_id}">Edit</button></td>
                </tr>`
        )
        .join("");

      tableBody.innerHTML = tableContent;

      // Add event listeners to the edit buttons after rendering the table
      document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const medicineId = e.target.getAttribute("data-id");
          editMedicine(medicineId);
        });
      });
    } else {
      tableBody.innerHTML =
        '<tr><td colspan="8">Failed to load data.</td></tr>';
      errorNotification("Failed to fetch medicine data.");
    }
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
    errorNotification("An error occurred: " + error.message);
  }
}

// Handle form submissions for medicine
document
  .getElementById("form_medicine")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = document.querySelector(
      "#form_medicine button[type='submit']"
    );
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    const formData = new FormData(this);

    try {
      const response = await fetch(`${backendURL}/api/medicine`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        document.getElementById("form_medicine").reset();

        // Hide the modal
        const modalElement = document.getElementById("medicine_modal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          const bsModal = new bootstrap.Modal(modalElement);
          bsModal.hide();
        }

        await getMedicine(); // Refresh the table with the new data
      } else if (response.status === 422) {
        const json = await response.json();
        errorNotification(json.message, 5);
      } else {
        throw new Error("Network response was not ok.");
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message, 5);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Add`;
    }
  });

// Edit Medicine
async function editMedicine(id) {
  console.log("Editing medicine with ID:", id); // Ensure ID is correct before API call

  try {
    const response = await fetch(`${backendURL}/api/medicine/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const medicine = await response.json();
      console.log("Fetched medicine data:", medicine); // Log the fetched data

      // Populate form fields with fetched data
      document.getElementById("medicine_id").value = medicine.medicine_id;
      document.getElementById("name").value = medicine.name;
      document.getElementById("usage_description").value =
        medicine.usage_description;
      document.getElementById("quantity").value = medicine.quantity;
      document.getElementById("expiration_date").value =
        medicine.expiration_date;
      document.getElementById("batch_no").value = medicine.batch_no;
      document.getElementById("location").value = medicine.location;
      document.getElementById("medicine_status").value =
        medicine.medicine_status;

      // Show the modal
      const modalElement = document.getElementById("medicine_modal");
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Handle form submission for editing medicine
document
  .getElementById("form_medicine")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = document.querySelector(
      "#form_medicine button[type='submit']"
    );
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    const formData = new FormData(document.getElementById("form_medicine"));
    const medicineId = document.getElementById("medicine_id").value;
    const formJSON = Object.fromEntries(formData.entries());

    console.log("Form data to submit:", formJSON);

    try {
      const response = await fetch(`${backendURL}/api/medicine/${medicineId}`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formJSON),
      });

      if (response.ok) {
        const json = await response.json();
        successNotification("Medicine details saved successfully.", 5);
        document.getElementById("form_medicine").reset();

        // Hide the modal
        const modalElement = document.getElementById("medicine_modal");
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide(); // Hide the modal after saving

        await getMedicine(); // Refresh the table with new data
      } else if (response.status === 422) {
        const json = await response.json();
        errorNotification(json.message, 5);
      } else {
        throw new Error("Network response was not ok.");
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message, 5);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Save`;
    }
  });

// Function to fetch the Equipment data
async function getEquipment(query = "", order = "asc") {
  // Remove any leftover modal artifacts
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.remove();
  });

  const token = localStorage.getItem("token");
  const tableBody = document.querySelector("#equipment_table tbody");

  tableBody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

  try {
    const response = await fetch(
      `${backendURL}/api/equipment?search=${query}&order=${order}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const json = await response.json();
      let tableContent = json
        .map(
          (equipment) => `
                <tr>
                    <td>${equipment.equipment_id}</td>
                    <td>${equipment.description}</td>
                    <td>${equipment.location}</td>
                    <td>${equipment.quantity}</td>
                    <td>${equipment.condition}</td>
                    <td>${equipment.equipment_status}</td>
                    <td><button class="btn btn-warning btn-sm edit-btn" data-id="${equipment.equipment_id}">Edit</button></td>
                </tr>`
        )
        .join("");

      tableBody.innerHTML = tableContent;

      // Add event listeners to the edit buttons after rendering the table
      document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const equipmentId = e.target.getAttribute("data-id");
          editEquipment(equipmentId);
        });
      });
    } else {
      tableBody.innerHTML =
        '<tr><td colspan="8">Failed to load data.</td></tr>';
      errorNotification("Failed to fetch equipment data.");
    }
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
    errorNotification("An error occurred: " + error.message);
  }
}

// Handle form submissions for Equipment
document
  .getElementById("form_equipment")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = document.querySelector(
      "#form_equipment button[type='submit']"
    );
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    const formData = new FormData(this);

    try {
      const response = await fetch(`${backendURL}/api/equipment`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const json = await response.json();
        document.getElementById("form_equipment").reset();

        // Hide the modal
        const modalElement = document.getElementById("equipment_modal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          const bsModal = new bootstrap.Modal(modalElement);
          bsModal.hide();
        }

        await getEquipment(); // Refresh the table with the new data
      } else if (response.status === 422) {
        const json = await response.json();
        errorNotification(json.message, 5);
      } else {
        throw new Error("Network response was not ok.");
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message, 5);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Save`;
    }
  });

// Add event listener for dynamically created buttons
document
  .querySelector("#equipment_table")
  .addEventListener("click", function (e) {
    if (e.target.classList.contains("edit-btn")) {
      const equipmentId = e.target.getAttribute("data-id");
      editEquipment(equipmentId); // Function to load data into modal
    }
  });

async function editEquipment(id) {
  console.log("Editing equipment with ID:", id); // Ensure ID is correct before API call

  try {
    const response = await fetch(`${backendURL}/api/equipment/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const equipment = await response.json();
      console.log("Fetched equipment data:", equipment); // Log the fetched data

      // Populate form fields with fetched data
      document.getElementById("equipment_id").value = equipment.equipment_id;
      document.getElementById("description").value = equipment.description;
      document.getElementById("location").value = equipment.location;
      document.getElementById("quantity").value = equipment.quantity;
      document.getElementById("condition").value = equipment.condition;
      document.getElementById("equipment_status").value =
        equipment.equipment_status;

      // Show the modal
      const modalElement = document.getElementById("equipment_modal");
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Handle form submission for editing equipment
document
  .getElementById("form_equipment")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = document.querySelector(
      "#form_equipment button[type='submit']"
    );
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    const formData = new FormData(document.getElementById("form_equipment"));
    const equipmentId = document.getElementById("equipment_id").value;
    const formJSON = Object.fromEntries(formData.entries());

    console.log("Form data to submit:", formJSON);

    try {
      const response = await fetch(
        `${backendURL}/api/equipment/${equipmentId}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formJSON),
        }
      );

      if (response.ok) {
        const json = await response.json();
        successNotification("Equipment details saved successfully.", 5);
        document.getElementById("form_equipment").reset();

        // Hide the modal
        const modalElement = document.getElementById("equipment_modal");
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide(); // Hide the modal after saving

        await getEquipment(); // Refresh the table with new data
      } else if (response.status === 422) {
        const json = await response.json();
        errorNotification(json.message, 5);
      } else {
        throw new Error("Network response was not ok.");
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message, 5);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Save`;
    }
  });

// Switch between tables using tabs
document.getElementById("medicine_tab_button").addEventListener("click", () => {
  showTable("medicine");
  getMedicine(); // Load the medicine data
});

document
  .getElementById("equipment_tab_button")
  .addEventListener("click", () => {
    showTable("equipment");
    getEquipment(); // Load the equipment data
  });

// General sort function for sorting any table by Quantity column
function sortTable(tbody, order) {
  const rowsArray = Array.from(tbody.querySelectorAll("tr"));

  rowsArray.sort((rowA, rowB) => {
    const quantityA = parseInt(rowA.cells[3].textContent.trim(), 10);
    const quantityB = parseInt(rowB.cells[3].textContent.trim(), 10);

    return order === "Ascending"
      ? quantityA - quantityB
      : quantityB - quantityA;
  });

  rowsArray.forEach((row) => tbody.appendChild(row)); // Re-append sorted rows
}

// Function to search through table
function searchTable(tbody) {
  const searchInput = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const rows = tbody.querySelectorAll("tr");

  rows.forEach((row) => {
    const cells = Array.from(row.cells);
    const matched = cells.some((cell) =>
      cell.textContent.toLowerCase().includes(searchInput)
    );
    row.style.display = matched ? "" : "none";
  });
}

// Event listener for sorting and searching in the medicine table
document.addEventListener("DOMContentLoaded", () => {
  const medicineTable = document.getElementById("medicine_table");
  const medicineTbody = medicineTable.querySelector("tbody");

  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const order = event.target.textContent;
      sortTable(medicineTbody, order);
    });
  });

  document
    .getElementById("searchButton")
    .addEventListener("click", () => searchTable(medicineTbody));
  document
    .getElementById("searchInput")
    .addEventListener("input", () => searchTable(medicineTbody));
});

// Event listener for sorting and searching in the equipment table
document.addEventListener("DOMContentLoaded", () => {
  const equipmentTable = document.getElementById("equipment_table");
  const equipmentTbody = equipmentTable.querySelector("tbody");

  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const order = event.target.textContent;
      sortTable(equipmentTbody, order);
    });
  });

  document
    .getElementById("searchButton")
    .addEventListener("click", () => searchTable(equipmentTbody));
  document
    .getElementById("searchInput")
    .addEventListener("input", () => searchTable(equipmentTbody));
});

// Handle search button click for getting medicine
document.getElementById("searchButton").addEventListener("click", async () => {
  const query = document.getElementById("searchInput").value;
  await getMedicine(query);
});

// Handle search input keypress (Enter key) for getting medicine
document
  .getElementById("searchInput")
  .addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = e.target.value;
      await getMedicine(query);
    }
  });

// Handle search button click for getting equipment
document.getElementById("searchButton").addEventListener("click", async () => {
  const query = document.getElementById("searchInput").value;
  await getEquipment(query);
});

// Handle search input keypress (Enter key) for getting equipment
document
  .getElementById("searchInput")
  .addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      const query = e.target.value;
      await getEquipment(query);
    }
  });

// Admin Pages Navigation (if applicable)
showNavAdminPages();
