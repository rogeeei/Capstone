import {
  backendURL,
  showNavAdminPages,
  errorNotification,
  fetchUserDetails,
  updateSideNav,
  successNotification,
} from "../utils/utils.js";

// Show Admin Pages
showNavAdminPages();
fetchUserDetails();
updateSideNav();

// Logout Button
const btn_logout = document.getElementById("btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", async () => {
    try {
      const response = await fetchWithAuth(`${backendURL}/api/logout`);
      if (response.ok) {
        localStorage.clear();
        successNotification("Logout Successful.");
        window.location.pathname = "/";
      } else {
        const json = await response.json();
        errorNotification(`Logout failed: ${json.message}`, 10);
      }
    } catch (error) {
      errorNotification("An error occurred during logout: " + error.message);
    }
  });
}

// Utility function for fetching data with Authorization headers
async function fetchWithAuth(url, options = {}) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    ...options.headers, // Merge additional headers if provided
  };

  const response = await fetch(url, { ...options, headers });
  return response;
}

// Fetch and display citizen data
getCitizens();

async function getCitizens(query = "") {
  try {
    const response = await fetchWithAuth(
      `${backendURL}/api/citizen${query ? `?search=${query}` : ""}`
    );
    if (response.ok) {
      const citizens = await response.json();
      displayCitizens(citizens);
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification(
      "An error occurred while fetching citizens: " + error.message
    );
  }
}

function displayCitizens(citizens) {
  // Ensure citizens data is an array and contains elements
  if (Array.isArray(citizens) && citizens.length > 0) {
    // Sort citizens by a property (e.g., id or date_added)
    citizens.sort((a, b) => b.citizen_id - a.citizen_id); // Descending order by `citizen_id`

    let tableBody = "";
    citizens.forEach((citizen) => {
      const servicesAvailed =
        citizen.services_availed && citizen.services_availed.length > 0
          ? citizen.services_availed.map((service) => service.name).join(", ")
          : "No services availed";
      tableBody += `
        <tr>
          <td>${citizen.lastname}</td>
          <td>${citizen.firstname}</td>
          <td>${citizen.gender}</td>
          <td>${calculateAge(citizen.date_of_birth)}</td>
          <td>${servicesAvailed}</td>
          <td>${citizen.address}</td>
          <td><button class="btn btn-info btn-sm" onclick="viewCitizen(${
            citizen.citizen_id
          })">View</button></td>
          <td><button class="btn btn-sm" onclick="editCitizen(${
            citizen.citizen_id
          })">Edit</button></td>
        </tr>`;
    });
    document.querySelector("table tbody").innerHTML = tableBody;
  } else {
    document.querySelector("table tbody").innerHTML =
      "<tr><td colspan='8'>No citizens found.</td></tr>";
  }
}

// Function to calculate age from birthdate
function calculateAge(birthdate) {
  if (!birthdate) return "N/A";
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function viewCitizen(citizenId) {
  console.log("Viewing citizen with ID:", citizenId);
  window.location.href = `/profiling.html?citizen_id=${citizenId}`;
}

// Function to open "Add Citizen" form modal
function addCitizen() {
  // Reset the form for a new citizen
  document.getElementById("form_citizen").reset();
  document.getElementById("citizen_id").value = ""; // Ensure ID is empty for a new entry
  fetchServices([]); // Reset services selection

  // Open the modal
  const modalElement = document.getElementById("citizen_form_modal");
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

// Fetch and display available services in the dropdown
async function fetchServices(selectedServiceIds = []) {
  try {
    const response = await fetchWithAuth(`${backendURL}/api/services`);
    if (response.ok) {
      const services = await response.json();
      const servicesMenu = document.getElementById("services_availed_menu");
      servicesMenu.innerHTML = ""; // Clear previous options

      services.forEach((service) => {
        const isSelected = selectedServiceIds.includes(service.id);
        const listItem = document.createElement("li");
        listItem.classList.add("dropdown-item");
        listItem.textContent = service.name;

        // Add event listener to toggle service selection
        listItem.addEventListener("click", () => {
          toggleServiceSelection(service, isSelected);
        });

        servicesMenu.appendChild(listItem);
      });
    } else {
      errorNotification(
        "Failed to fetch services. HTTP-Error: " + response.status
      );
    }
  } catch (error) {
    errorNotification(
      "An error occurred while fetching services: " + error.message
    );
  }
}

// Function to toggle service selection and display selected services
let selectedServiceIds = []; // Keep track of selected service IDs

function toggleServiceSelection(service, isSelected) {
  const selectedServicesContainer =
    document.getElementById("selected_services");

  if (isSelected) {
    // If the service is already selected, remove it from the array
    selectedServiceIds = selectedServiceIds.filter((id) => id !== service.id);
    // Also remove the badge from the UI
    selectedServicesContainer.innerHTML =
      selectedServicesContainer.innerHTML.replace(
        `<span class="badge bg-info me-2">${service.name}</span>`,
        ""
      );
  } else {
    // Otherwise, add it to the array of selected services
    selectedServiceIds.push(service.id);
    const selectedServiceBadge = document.createElement("span");
    selectedServiceBadge.classList.add("badge", "bg-info", "me-2");
    selectedServiceBadge.textContent = service.name;
    selectedServicesContainer.appendChild(selectedServiceBadge);
  }
}

// Event listener for "Add Citizen" button
document.getElementById("modal_show").addEventListener("click", addCitizen);
document.querySelectorAll(".editCitizenButton").forEach((button) => {
  button.addEventListener("click", () => {
    const citizenId = button.dataset.citizenId; // Use data attributes for dynamic citizen ID
    editCitizen(citizenId);
  });
});

// Editing Citizen
async function editCitizen(id) {
  console.log("Editing citizen with ID:", id);

  try {
    const response = await fetchWithAuth(`${backendURL}/api/citizen/${id}`);
    console.log("Response status:", response.status);

    if (response.ok) {
      const citizen = await response.json();
      console.log("Citizen data fetched:", citizen);

      populateCitizenForm(citizen); // Populate the form with data
      console.log("Form populated successfully");

      const modalElement = document.getElementById("citizen_form_modal");
      console.log("Modal element found:", modalElement);

      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      console.log("Modal shown successfully");
    } else {
      console.error("Failed to fetch citizen. HTTP-Error: " + response.status);
      errorNotification(
        "Failed to fetch citizen. HTTP-Error: " + response.status
      );
    }
  } catch (error) {
    console.error(
      "An error occurred while fetching citizen data: " + error.message
    );
    errorNotification(
      "An error occurred while fetching citizen data: " + error.message
    );
  }
}

function populateCitizenForm(citizen) {
  document.getElementById("citizen_id").value = citizen.citizen_id || "";
  document.getElementById("firstname").value = citizen.firstname || "";
  document.getElementById("middle_name").value = citizen.middle_name || "";
  document.getElementById("lastname").value = citizen.lastname || "";
  document.getElementById("suffix").value = citizen.suffix || "";
  document.getElementById("address").value = citizen.address || "";
  document.getElementById("date_of_birth").value = citizen.date_of_birth || "";
  document.getElementById("gender").value = citizen.gender || "";
  document.getElementById("citizen_status").value =
    citizen.citizen_status || "";
  document.getElementById("blood_type").value = citizen.blood_type || "";
  document.getElementById("height").value = citizen.height || "";
  document.getElementById("weight").value = citizen.weight || "";
  document.getElementById("allergies").value = citizen.allergies || "";
  document.getElementById("condition").value = citizen.condition || "";
  document.getElementById("medication").value = citizen.medication || "";
  document.getElementById("emergency_contact_name").value =
    citizen.emergency_contact_name || "";
  document.getElementById("emergency_contact_no").value =
    citizen.emergency_contact_no || "";

  // Use an empty array if services is undefined
  const services = citizen.services || [];
  fetchServices(services.map((service) => service.id));
}

// Handle form submission

// Attach functions to the window object
window.viewCitizen = viewCitizen;
window.editCitizen = editCitizen;

document
  .getElementById("form_citizen")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = document.querySelector(
      "#form_citizen button[type='submit']"
    );
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    // Collect form data into an object
    const formData = new FormData(document.getElementById("form_citizen"));
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });

    // Ensure 'services_availed' is collected properly
    const servicesAvailed = selectedServiceIds; // Use the `selectedServiceIds` array
    if (servicesAvailed.length === 0) {
      errorNotification("Please select at least one service.", 5);
      submitButton.disabled = false;
      submitButton.innerHTML = "Save";
      return;
    }

    // Append services_availed to the form data
    formObject.services_availed = JSON.stringify(servicesAvailed);

    const citizenId = document.getElementById("citizen_id").value;

    try {
      const response = await fetchWithAuth(
        `${backendURL}/api/citizen/${citizenId}`,
        {
          method: citizenId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const json = await response.json();
        successNotification("Citizen details saved successfully.", 5);
        document.getElementById("form_citizen").reset();
        const modalElement = document.getElementById("citizen_form_modal");
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide();
        getCitizens(); // Reload the citizens list
      } else {
        const json = await response.json();
        console.log("Validation errors:", json);
        errorNotification(`Error: ${json.message}`, 10);
      }
    } catch (error) {
      errorNotification(
        "Error occurred while saving citizen data: " + error.message,
        10
      );
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = "Save";
    }
  });

// Handle search button click
document.getElementById("searchButton").addEventListener("click", async () => {
  const query = document.getElementById("searchInput").value;
  await getCitizens(query);
});

// Handle search input keypress (Enter key)
document
  .getElementById("searchInput")
  .addEventListener("keypress", async (e) => {
    if (e.key === "Search") {
      const query = e.target.value;
      await getCitizens(query);
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("citizen_table");
  const tbody = table.querySelector("tbody");

  // Function to sort table rows
  function sortTable(order) {
    const rowsArray = Array.from(tbody.querySelectorAll("tr"));

    rowsArray.sort((rowA, rowB) => {
      const lastNameA = rowA.cells[0].textContent.trim();
      const lastNameB = rowB.cells[0].textContent.trim();

      if (order === "Ascending") {
        return lastNameA.localeCompare(lastNameB);
      } else {
        return lastNameB.localeCompare(lastNameA);
      }
    });

    // Append sorted rows
    rowsArray.forEach((row) => tbody.appendChild(row));
  }

  // Event listener for dropdown menu
  document.querySelectorAll(".dropdown-menu .dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      const order = event.target.textContent;
      sortTable(order);
    });
  });

  // Function to search through table
  function searchTable() {
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

  // Event listener for search button
  document
    .getElementById("searchButton")
    .addEventListener("click", searchTable);

  // Event listener for search input
  document.getElementById("searchInput").addEventListener("input", searchTable);
});
