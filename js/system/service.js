import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Function to fetch services from API and display them dynamically
async function loadServices() {
  try {
    const response = await fetch(`${backendURL}/api/services`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }

    const services = await response.json();
    const serviceCardsContainer = document.getElementById("serviceCards");

    // Clear previous content
    serviceCardsContainer.innerHTML = "";

    // Loop through services and create cards
    services.forEach((service) => {
      const serviceCard = `
                <div class="col-md-4">
                    <div class="card service-card" data-service-id="${service.id}">
                        <div class="card-body text-start">
                            <h5 class="card-title fw-bold">${service.name}</h5>
                            <p class="totalCitizen" style="font-size: 0.9rem;">
                                Total Citizens: <span id="totalCitizens-${service.id}">Loading...</span>
                            </p>
                            <canvas id="ageDistributionChart-${service.id}" width="100" height="100"></canvas>
                        </div>
                    </div>
                </div>
            `;
      serviceCardsContainer.innerHTML += serviceCard;
    });

    // Fetch the age distribution for each service
    services.forEach((service) => {
      fetchAgeDistribution(service.id);
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    errorNotification("Unable to load services. Please try again later.");
  }
}

// Fetch age distribution data for the service
async function fetchAgeDistribution(serviceId) {
  try {
    const response = await fetch(
      `${backendURL}/api/services/${serviceId}/age-distribution`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch age distribution data for service ID ${serviceId}`
      );
    }

    const { serviceName, ageGroups, totalCitizens } = await response.json();

    // Update total citizens
    const totalCitizensElement = document.getElementById(
      `totalCitizens-${serviceId}`
    );
    if (totalCitizensElement) {
      totalCitizensElement.textContent = totalCitizens;
    } else {
      console.warn(`Element with ID totalCitizens-${serviceId} not found.`);
    }

    // Create the age distribution chart
    createAgeDistributionChart(serviceId, serviceName, ageGroups);
  } catch (error) {
    console.error(
      `Error fetching age distribution for service ID ${serviceId}:`,
      error
    );
    errorNotification(`Error loading data for service ${serviceId}.`);
  }
}

// Create the pie chart with Chart.js
function createAgeDistributionChart(serviceId, serviceName, ageGroups) {
  const ctx = document.getElementById(`ageDistributionChart-${serviceId}`);

  if (!ctx) {
    console.warn(`Canvas for service ID ${serviceId} not found.`);
    return;
  }

  if (!ageGroups || ageGroups.length === 0) {
    console.warn(`No age group data available for service ID ${serviceId}`);
    ctx.textContent = "No data available";
    return;
  }

  const labels = ageGroups.map((group) => group.age_group);
  const data = ageGroups.map((group) => group.count);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Age Distribution for ${serviceName}`,
          data: data,
          backgroundColor: [
            "#0056b3",
            "#003f7f",
            "#006eff",
            "#0099ff",
            "#00b3ff",
            "#00ccff",
            "#00e6ff",
            "#005ea1",
          ],
          hoverBackgroundColor: ["#0FD5B1"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem) =>
              `${tooltipItem.label}: ${tooltipItem.raw} citizens`,
          },
        },
      },
    },
  });
}

// Call loadServices to fetch and display the data
loadServices();
