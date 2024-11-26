import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  fetchUserDetails,
  updateSideNav,
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

// Fetch and display services
async function getServices(query = "") {
  try {
    console.log("Attempting to fetch services...");
    const response = await fetch(
      `${backendURL}/api/services${query ? `?search=${query}` : ""}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const services = await response.json();
      let cardHTML = "";
      services.forEach((service) => {
        cardHTML += `
                  <div class="card mb-3" style="width: 18rem;" data-id="${service.id}">
                      <div class="card-body">
                          <h5 class="card-title">${service.name}</h5>
                          <p class="card-text">${service.description}</p>
                          <div class="card-buttons">
                              <button class="btn btn-edit" onclick="viewService(${service.id})">View</button>
                              <button class="btn-delete ms-0" style="background-color: #dc3545; border-radius: 0.25rem;" onclick="deleteService(${service.id})">Delete</button>
                          </div>
                      </div>
                  </div>`;
      });
      document.getElementById("servicesContainer").innerHTML = cardHTML;
    } else {
      errorNotification(
        `Failed to load services: HTTP Error ${response.status}`
      );
    }
  } catch (error) {
    errorNotification(
      "An error occurred while fetching services: " + error.message
    );
  }
}

// Initial load of services
getServices();
getOverview();

// Handle form submission for adding a new service
document
  .getElementById("addServiceForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span>Saving...</span>`;

    const formData = new FormData(e.target);

    try {
      const response = await fetch(`${backendURL}/api/services`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        successNotification("Service added successfully.");
        document.getElementById("addServiceForm").reset();

        // Hide the modal
        const modalElement = document.getElementById("addServiceModal");
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide();

        await getServices(); // Refresh the services list
      } else if (response.status === 422) {
        const json = await response.json();
        errorNotification(json.message);
      } else {
        throw new Error("Network response was not ok.");
      }
    } catch (error) {
      errorNotification("An error occurred: " + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `Add Service`;
    }
  });

async function getOverview(query = "") {
  try {
    console.log("Attempting to fetch citizen overview...");
    const response = await fetch(`${backendURL}/api/citizen-overview`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    console.log("Response received:", response);

    if (response.ok) {
      const citizens = await response.json();
      console.log("Citizen data received:", citizens);

      let tableBody = "";
      citizens.forEach((citizen) => {
        // Check if services_availed exist for this citizen and loop through them
        const servicesAvailed =
          citizen.services_availed.length > 0
            ? citizen.services_availed.map((service) => service.name).join(", ") // Join services by comma
            : "No services availed"; // Default text if no services

        // Convert the created_at to local time
        const utcDate = new Date(citizen.created_at); // Assuming the server sends UTC date
        const localDate = new Date(utcDate.toLocaleString()); // Converts it to local time

        // Format the time to only show hours and minutes
        const localTime = localDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        tableBody += `
                  <tr>
                      <td>${localTime}</td>  <!-- Displaying the local time -->
                      <td>${citizen.lastname}</td>
                      <td>${citizen.firstname}</td>
                      <td>${servicesAvailed}</td>
                  </tr>`;
      });

      const tableElement = document.querySelector("table tbody");
      if (tableElement) {
        tableElement.innerHTML = tableBody;
        console.log("Table updated successfully.");
      } else {
        console.error("Table tbody element not found.");
      }
    } else {
      errorNotification("HTTP-Error: " + response.status);
      console.error("HTTP Error:", response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
    console.error("Fetch error:", error);
  }
}

// Attach function to the global window object
window.deleteService = async function (serviceId) {
  if (!confirm("Are you sure you want to delete this service?")) {
    return; // Abort if the user cancels the deletion
  }

  try {
    const response = await fetch(`${backendURL}/api/services/${serviceId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      successNotification("Service deleted successfully.");
      await getServices(); // Refresh the list of services
    } else {
      const json = await response.json();
      errorNotification(`Failed to delete service: ${json.message}`);
    }
  } catch (error) {
    errorNotification(
      "An error occurred while deleting the service: " + error.message
    );
  }
};

// Define the ViewService function correctly
function viewService(serviceId) {
  console.log("Viewing service with ID:", serviceId); // Debugging step
  window.location.href = `/service_view.html?service_id=${serviceId}`; // Ensure URL parameter matches the one in service_view.js
}

window.viewService = viewService;
