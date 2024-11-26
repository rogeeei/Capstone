import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const citizenId = urlParams.get("citizen_id");
  if (citizenId) {
    fetchCitizenDetails(citizenId);
  } else {
    errorNotification("Citizen ID is missing.");
  }

  // Event listener to handle form submission for adding diagnostic
  const addDiagnosticForm = document.getElementById("addDiagnosticForm");
  if (addDiagnosticForm) {
    addDiagnosticForm.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevent form submission
      const diagnosis = document.getElementById("diagnosis").value; // Diagnosis input field
      addDiagnostic(diagnosis, citizenId); // Call the function to add a diagnostic
    });
  }

  // Event listener for month selection
  const monthDropdownItems = document.querySelectorAll(".dropdown-item");
  monthDropdownItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      const selectedMonth = event.target.getAttribute("data-month");
      filterTransactionHistoryByMonth(selectedMonth, citizenId);
    });
  });
});

async function addDiagnostic(diagnosis, citizenId) {
  if (!diagnosis) {
    errorNotification("Diagnosis is required.");
    return;
  }

  try {
    const response = await fetch(`${backendURL}/api/diagnostics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        diagnosis: diagnosis,
        citizen_id: citizenId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        successNotification("Diagnostic record added successfully!");

        // Close the modal after success
        const modalElement = document.getElementById("addDiagnosticModal");
        const modal =
          bootstrap.Modal.getInstance(modalElement) ||
          new bootstrap.Modal(modalElement);
        modal.hide();

        // Reset the form fields after closing the modal
        document.getElementById("addDiagnosticForm").reset();

        console.log("Diagnostic added:", data.data); // Log for debugging
      } else {
        errorNotification(data.message || "Failed to add diagnostic.");
      }
    } else {
      errorNotification(`HTTP Error: ${response.status}`);
    }
  } catch (error) {
    errorNotification(`An error occurred: ${error.message}`);
  }
}

// Fetching Citizen Details
async function fetchCitizenDetails(citizen_id) {
  try {
    const response = await fetch(`${backendURL}/api/citizen/${citizen_id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const citizen = await response.json();

      // Log the full citizen object to check the structure
      console.log("Citizen Data:", citizen);

      if (!citizen || !citizen.citizen_id) {
        errorNotification("Citizen not found");
        return;
      }

      document.getElementById("citizen_id_input").value = citizen.citizen_id;
      populateCitizenDetails(citizen);
    } else {
      errorNotification(`HTTP-Error: ${response.status}`);
    }
  } catch (error) {
    errorNotification(`An error occurred: ${error.message}`);
  }
}

// Populate Citizen Details
function populateCitizenDetails(citizen) {
  const servicesAvailed = citizen.services_availed
    ? Object.values(citizen.services_availed)
        .map((service) => `<p>${service.name || "Unknown Service"}</p>`)
        .join("")
    : "<p class='no-services'>No services availed</p>";

  const gender = citizen.gender || "Not specified";

  document.getElementById("citizen_id").innerText = citizen.citizen_id;
  document.getElementById(
    "lastname"
  ).innerText = `${citizen.firstname} ${citizen.lastname}`;
  document.getElementById("citizenAge").innerText = calculateAge(
    citizen.date_of_birth
  );
  document.getElementById("gender").innerText = gender;
  document.getElementById("address").innerText = citizen.address;
  document.getElementById("services_availed").innerHTML = servicesAvailed;

  fetchTransactionHistory(citizen.citizen_id); // Initially fetch all transactions
}

// Fetching Transaction History
async function fetchTransactionHistory(citizenId) {
  try {
    const response = await fetch(
      `${backendURL}/api/transaction-history/${citizenId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      const tableBody = document.getElementById("transactionHistoryBody");
      tableBody.innerHTML = "";

      if (!data.histories || data.histories.length === 0) {
        tableBody.innerHTML =
          "<tr><td colspan='4'>No transaction history available</td></tr>";
        return;
      }

      data.histories.forEach((history, index) => {
        const row = createTransactionRow(history, index);
        tableBody.appendChild(row);
      });

      // Save the fetched histories for diagnostics view
      window.transactionHistories = data.histories;
    } else {
      errorNotification(`HTTP-Error: ${response.status}`);
    }
  } catch (error) {
    errorNotification(`An error occurred: ${error.message}`);
  }
}

// Filter Transaction History by Month
function filterTransactionHistoryByMonth(month, citizenId) {
  const filteredHistories = window.transactionHistories.filter((history) => {
    const transactionDate = new Date(history.date_availed);
    return transactionDate.getMonth() + 1 === parseInt(month);
  });

  // Update the transaction table with filtered results
  const tableBody = document.getElementById("transactionHistoryBody");
  tableBody.innerHTML = "";

  if (filteredHistories.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='4'>No transactions found for this month</td></tr>";
  } else {
    filteredHistories.forEach((history, index) => {
      const row = createTransactionRow(history, index);
      tableBody.appendChild(row);
    });
  }
}

// Create Transaction Row
function createTransactionRow(history, index) {
  const row = document.createElement("tr");

  // Date Cell
  const dateCell = document.createElement("td");
  const formattedDate = new Date(
    `${history.date_availed}T00:00:00Z`
  ).toLocaleDateString();
  dateCell.innerText = formattedDate || "Invalid Date";
  row.appendChild(dateCell);

  // Services Cell
  const servicesCell = document.createElement("td");
  servicesCell.innerHTML =
    history.transaction && history.transaction.length > 0
      ? `<p>${history.transaction}</p>`
      : "<p>No services availed</p>";
  row.appendChild(servicesCell);

  // Add Button Cell
  const addButtonCell = document.createElement("td");
  const addButton = document.createElement("button");
  addButton.innerText = "Add";
  addButton.classList.add("btn", "btn-primary", "add-button");

  // Add click event listener to the "Add" button
  addButton.addEventListener("click", () => {
    document.getElementById("citizen_id_input").value = history.citizen_id;
    document.getElementById("diagnosis").value = "";

    const modal = new bootstrap.Modal(
      document.getElementById("addDiagnosticModal")
    );
    modal.show();
  });

  addButtonCell.appendChild(addButton);
  row.appendChild(addButtonCell);

  return row;
}

// View Diagnostic Details
function viewDiagnosticDetails() {
  const histories = window.transactionHistories || [];
  const diagnosticTableBody = document.getElementById("diagnosticTableBody");
  diagnosticTableBody.innerHTML = "";

  if (histories.length === 0) {
    diagnosticTableBody.innerHTML =
      "<tr><td colspan='2'>No diagnostic details available</td></tr>";
    return;
  }

  histories.forEach((history) => {
    if (history.diagnostics && history.diagnostics.length > 0) {
      history.diagnostics.forEach((diagnostic) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${diagnostic.diagnosis || "No diagnosis provided"}</td>
          <td>${new Date(diagnostic.date).toLocaleDateString()}</td>`;
        diagnosticTableBody.appendChild(row);
      });
    } else {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="2">No diagnostics available for transaction: ${history.transaction}</td>`;
      diagnosticTableBody.appendChild(row);
    }
  });

  const modal = new bootstrap.Modal(
    document.getElementById("viewDiagnosticModal")
  );
  modal.show();
}

// Attach the function to the modal trigger
document
  .querySelector(".filter_btn")
  .addEventListener("click", viewDiagnosticDetails);

// Calculate Age
function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const ageDiff = Date.now() - birthDate.getTime();
  const ageDate = new Date(ageDiff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
