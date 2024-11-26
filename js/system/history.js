import {
  backendURL,
  showNavAdminPages,
  errorNotification,
  successNotification,
} from "../utils/utils.js";

// Get Admin Pages
showNavAdminPages();

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

// Select DOM elements
const historyTableBody = document.querySelector("table tbody");
const monthDropdown = document.getElementById("monthDropdown"); // The dropdown for months

async function getHistoryByMonth(monthYear = "") {
  try {
    console.log("Attempting to fetch citizen history by month...");

    // Request to fetch history data
    const response = await fetch(`${backendURL}/api/monthly-history`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    console.log("Response received:", response);

    if (response.ok) {
      const data = await response.json();
      console.log("Citizen history data received:", data);

      // Check if data exists
      if (data && Object.keys(data).length > 0) {
        renderMonthDropdown(data);
        renderHistoryTable(data, monthYear);
      } else {
        errorNotification("No records found for this month.");
      }
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Render the month dropdown with available months, show "No citizens found" if no data for a month
function renderMonthDropdown(data) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthDropdown =
    document.getElementById("monthDropdown").nextElementSibling; // Assuming the dropdown is an <ul> element
  const monthsInData = Object.keys(data); // Get all available month-year keys from the data

  monthDropdown.innerHTML = ""; // Clear existing items

  // Iterate over all months of the year (January - December)
  monthNames.forEach((monthName, index) => {
    // Iterate over all available years in the data
    const years = [...new Set(monthsInData.map((item) => item.split(" ")[1]))]; // Extract unique years from the keys

    years.forEach((year) => {
      const monthKey = `${monthName} ${year}`; // Format month-year like "January 2024"
      const monthData = data[monthKey]; // Check if data exists for that month

      const option = document.createElement("a");
      option.classList.add("dropdown-item");
      option.href = "#";
      option.dataset.month = monthKey; // Store month-year in the data attribute
      option.textContent = `${monthName} ${year}`; // Display the full month-year

      // If no data for that month, display "No citizens found"
      if (!monthData || monthData.length === 0) {
        option.textContent = `${monthName} ${year} - No citizens found`;
        option.classList.add("text-muted"); // Optionally, add a muted class for styling
      }

      // Attach click event listener for selecting the month
      option.addEventListener("click", (event) => {
        const selectedMonth = event.target.dataset.month;
        console.log("Selected month:", selectedMonth); // For debugging
        // Call the function to fetch history data for the selected month
        getHistoryByMonth(selectedMonth);
      });

      monthDropdown.appendChild(option);
    });
  });
}

function renderHistoryTable(data, selectedMonth) {
  let tableBody = "";
  let citizens = selectedMonth ? data[selectedMonth] : []; // Filter citizens by the selected month or all records

  if (citizens.length === 0) {
    tableBody = `<tr><td colspan="8">No records found for the selected month.</td></tr>`;
  } else {
    citizens.forEach((citizen) => {
      // Ensure services_availed is available and is being passed correctly from the backend
      const servicesAvailed = citizen.services_availed || "No services availed";

      // Generate the table row for each citizen
      tableBody += `
        <tr>
          <td>${citizen.lastname}</td>
          <td>${citizen.firstname}</td>
          <td>${citizen.gender}</td>
          <td>${calculateAge(citizen.date_of_birth)}</td>
          <td>${servicesAvailed}</td>  <!-- Here the services are displayed -->
          <td>${citizen.address}</td>

        </tr>
      `;
    });
  }

  // Insert the generated table body into the table
  document.querySelector("table tbody").innerHTML = tableBody;
}

// Initial fetch to populate the table with all data
getHistoryByMonth();

// Function to calculate age from birthdate
function calculateAge(birthdate) {
  if (!birthdate) return "N/A"; // Handle case where birthdate is null or undefined
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

// Select the table body and search input elements
const tbody = document.querySelector("table tbody");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

// Function to filter table rows based on search input
function searchTable() {
  const searchValue = searchInput.value.toLowerCase(); // Get the search input value
  const rows = tbody.querySelectorAll("tr"); // Select all rows in the table body

  rows.forEach((row) => {
    const cells = Array.from(row.cells); // Convert row cells into an array
    const matched = cells.some((cell) =>
      cell.textContent.toLowerCase().includes(searchValue)
    ); // Check if any cell contains the search value
    row.style.display = matched ? "" : "none"; // Show or hide the row
  });
}

// Event listener for search button
searchButton.addEventListener("click", searchTable);

// Event listener for search input (on input change)
searchInput.addEventListener("input", searchTable);

// Event listener for Enter key
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchTable();
  }
});
