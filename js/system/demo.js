import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

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
