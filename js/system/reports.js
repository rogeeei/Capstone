import { backendURL } from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  fetchDemographicSummary();
});

function fetchDemographicSummary() {
  const apiUrl = `${backendURL}/api/demo-summary`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (
        data &&
        data.ageGroups &&
        data.genderDistribution &&
        data.totalPopulation
      ) {
        const ageContainer = document.querySelector(".card-age .card-body");
        Object.entries(data.ageGroups).forEach(([group, count]) => {
          const ageGroupDiv = document.createElement("div");
          ageGroupDiv.classList.add("age-group");

          // Age group (right side)
          const groupSpan = document.createElement("span");
          groupSpan.textContent = group; // Age group name
          ageGroupDiv.appendChild(groupSpan);

          // Age count (left side)
          const countSpan = document.createElement("span");
          countSpan.textContent = count; // Count of people in that age group
          ageGroupDiv.appendChild(countSpan);

          // Append the age group to the container
          ageContainer.appendChild(ageGroupDiv);
        });

        // Populate Gender Data
        const genderContainer = document.querySelector(
          ".card-gender .card-body"
        );

        // Clear existing content (if needed)
        genderContainer.innerHTML = "";

        // Create a title element for the card
        const title = document.createElement("h5");
        title.textContent = "Gender Distribution";
        title.classList.add("card-title", "fw-bold", "text-start"); // Match existing styles
        genderContainer.appendChild(title);

        // Create a container for the gender text
        const genderGroupList = document.createElement("div");
        genderGroupList.classList.add("gender-group-list");

        // Loop through gender distribution and add formatted text
        Object.entries(data.genderDistribution).forEach(([gender, count]) => {
          const capitalizedGender =
            gender.charAt(0).toUpperCase() + gender.slice(1);
          const p = document.createElement("p");
          p.textContent = `${capitalizedGender}: ${count}`;
          genderGroupList.appendChild(p);
        });

        // Append the gender text container to the card body
        genderContainer.appendChild(genderGroupList);

        // Populate Population Data
        const populationContainer = document.querySelector(
          ".card-population .card-body"
        );

        // Ensure the container exists before appending
        if (populationContainer) {
          // Create the total population text
          const populationText = document.createElement("p");
          populationText.classList.add(
            "total-population",
            "mb-3",
            "fw-semibold"
          );
          populationText.textContent = `Total Population: ${data.totalPopulation}`;

          // Insert the text above the canvas
          populationContainer.insertBefore(
            populationText,
            document.getElementById("agePieChart")
          );
        }

        // Render Pie Chart for Age Distribution
        renderAgePieChart(data.ageGroups);
      } else {
        throw new Error("Invalid data structure received.");
      }
    })
    .catch((error) => {
      console.error("Error fetching demographic data:", error);
      const errorContainer = document.querySelector(".card-body");
      const errorMessage = document.createElement("p");
      errorMessage.textContent =
        "Failed to load demographic data. Please try again later.";
      errorContainer.appendChild(errorMessage);
    });
}

function renderAgePieChart(ageGroups) {
  const ctx = document.getElementById("agePieChart").getContext("2d");

  const labels = Object.keys(ageGroups);
  const data = Object.values(ageGroups);

  const agePieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels, // Age groups as labels
      datasets: [
        {
          data: data, // Counts for each age group
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
            label: function (tooltipItem) {
              return `${tooltipItem.label}: ${tooltipItem.raw} people`;
            },
          },
        },
      },
    },
  });
}

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
