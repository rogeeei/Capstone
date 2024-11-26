import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  viewService(); // Calling the function when the DOM is ready
});

async function viewService() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get("service_id"); // Correcting the parameter to match with dashboard.js

  if (!serviceId) {
    errorNotification("Service ID is missing.");
    return;
  }

  try {
    const response = await fetch(
      `${backendURL}/api/citizens/availed/${serviceId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Fetched data:", data); // Log the data for debugging

      // Check if citizens array exists and if serviceName is present
      const citizens = data.citizens || [];
      const serviceName = data.serviceName || "No service name";

      // Dynamically update service summary and barangay name
      const barangayName =
        citizens.length > 0 ? citizens[0].address : "No barangay data";
      document.getElementById("barangay-name").textContent = barangayName;
      document.getElementById("service-summary-header").textContent =
        serviceName;

      // Build the table rows dynamically
      let tableBody = "";
      if (citizens.length > 0) {
        citizens.forEach((citizen) => {
          tableBody += `
                        <tr>
                            <td>${citizen.address}</td>
                            <td>${citizen.lastname}</td>
                            <td>${citizen.firstname}</td>
                            <td>${citizen.middle_name || "N/A"}</td>
                            <td>${citizen.suffix || "N/A"}</td>
                            <td>${new Date(
                              citizen.created_at
                            ).toLocaleDateString()}</td>
                        </tr>
                    `;
        });
      } else {
        tableBody = `<tr><td colspan="6">No citizens have availed this service.</td></tr>`; // Fixed colspan to match the number of columns
      }

      document.querySelector("table tbody").innerHTML = tableBody;
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}
