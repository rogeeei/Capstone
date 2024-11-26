import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Fetch BHW data on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchBhw();
});

// Function to fetch all BHW users and populate the table
async function fetchBhw() {
  try {
    const response = await fetch(`${backendURL}/api/user`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const users = await response.json();
      let tableBody = "";

      users.forEach((user) => {
        tableBody += `
          <tr>
            <td>${user.user_id}</td>
            <td>${user.firstname}</td>
            <td>${user.middle_name}</td>
            <td>${user.lastname}</td>
            <td>${user.brgy}</td>
            <td>${user.email}</td>
            <td>${user.phone_number}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td><button class="btn btn-sm justify-content-end edit-btn" data-id="${
              user.user_id
            }">Edit</button></td>
          </tr>
        `;
      });

      document.querySelector("table tbody").innerHTML = tableBody;
      attachEditListeners(); // Re-attach edit listeners after table data is populated
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

// Function to handle edit button clicks and populate the modal
function attachEditListeners() {
  const editButtons = document.querySelectorAll(".edit-btn");
  editButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const userId = button.getAttribute("data-id");
      fetchUserData(userId)
        .then((userData) => {
          // Populate the modal with user data
          document.getElementById("firstname").value = userData.firstname;
          document.getElementById("middle_name").value = userData.middle_name;
          document.getElementById("lastname").value = userData.lastname;
          document.getElementById("suffix").value = userData.suffix || "";
          document.getElementById("birthdate").value = userData.birthdate;
          document.getElementById("brgy").value = userData.brgy;

          // Set user ID in hidden input
          document.getElementById("userId").value = userId;

          // Open the modal
          const editModal = new bootstrap.Modal(
            document.getElementById("edit_modal")
          );
          editModal.show();
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    });
  });
}

// Function to fetch user data based on user ID
async function fetchUserData(userId) {
  const response = await fetch(`${backendURL}/api/user/${userId}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!response.ok) {
    throw new Error("User data fetch failed");
  }
  return response.json();
}

// Handle form submission for editing user details
document
  .getElementById("edit_form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    const userId = document.getElementById("userId").value; // Get the user ID
    const formData = new FormData(this); // Collect form data

    // Convert FormData to a plain object
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    console.log("Form Data Sent: ", data); // Log data to check it's correct

    // Send the updated user data to the server
    editUser(userId, data);
  });

// Function to update user data
function editUser(userId, data) {
  fetch(`${backendURL}/api/user/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log("Response Data: ", responseData); // Log the response for debugging

      if (responseData.success) {
        successNotification("User updated successfully!");

        // Close the modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("edit_modal")
        );
        modal.hide();

        // Refresh the table with updated data
        fetchBhw(); // Re-fetch and update the table
      } else {
        errorNotification("Error updating user");
      }
    })
    .catch((error) => {
      console.error("Error updating user:", error);
      errorNotification("An error occurred");
    });
}

// Function to update the user data in the table dynamically
function updateTableWithUserData(userId, userData) {
  const row = document.querySelector(`#user_row_${userId}`); // Find the row with the corresponding user ID
  if (row) {
    // Update each cell with the new data
    row.querySelector(".firstname").textContent = userData.firstname;
    row.querySelector(".middle_name").textContent = userData.middle_name;
    row.querySelector(".lastname").textContent = userData.lastname;
    row.querySelector(".email").textContent = userData.email;
    row.querySelector(".phone_number").textContent = userData.phone_number;
    row.querySelector(".birthdate").textContent = userData.birthdate;
    row.querySelector(".brgy").textContent = userData.brgy;
    row.querySelector(".role").textContent = userData.role;

    // Optionally, update image if there's one
    const imageCell = row.querySelector(".image_path");
    if (userData.image_path) {
      imageCell.textContent = userData.image_path; // Or you can show the image if the path is available
    } else {
      imageCell.textContent = "No image"; // Placeholder if no image
    }
  }
}
