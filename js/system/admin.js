import {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Show Admin Pages
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

document.addEventListener("DOMContentLoaded", () => {
  fetchAdmin();
});

window.approveUser = async function (userId) {
  try {
    const response = await fetch(`${backendURL}/api/user/${userId}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to approve user");
    }

    // Show success notification
    successNotification("User approved successfully.");

    // Remove the user row from the table immediately
    removeUserRow(userId);

    // Optionally, call fetchAdmin() to refresh the data
    fetchAdmin();
  } catch (error) {
    errorNotification("Error approving user: " + error.message);
  }
};

window.declineUser = async function (userId) {
  try {
    const response = await fetch(`${backendURL}/api/user/decline/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to decline user");
    }

    // Show success notification
    successNotification("User declined successfully.");

    // Remove the user row from the table
    removeUserRow(userId);

    // Optionally, call fetchAdmin() to refresh the list
    fetchAdmin();
  } catch (error) {
    errorNotification("Error declining user: " + error.message);
  }
};

async function fetchAdmin(query = "") {
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

      // Filter out approved users
      const filteredUsers = users.filter(
        (user) => !user.approved && user.role !== "admin"
      );

      filteredUsers.forEach((user) => {
        tableBody += `
                  <tr id="user-${user.user_id}">
                      <td>${user.user_id}</td>
                      <td>${user.firstname}</td>
                      <td>${user.middle_name}</td>
                      <td>${user.lastname}</td>
                      <td>${user.brgy}</td>
                      <td>${user.email}</td>
                      <td>${user.phone_number}</td>
                      <td>${new Date(user.created_at).toLocaleString()}</td>
                      <td>${user.role}</td>
                      <td class="action-buttons">
                          <button class="btn btn-success" onclick="approveUser(${
                            user.user_id
                          })">Approve</button>
                           <button 
              class="btn-danger" 
              style="background-color: #dc3545;color: white; border-radius: 0.25rem; " 
              onclick="declineUser(${user.user_id})">
              Decline
          </button>
                      </td>
                  </tr>
              `;
      });

      document.querySelector("table tbody").innerHTML = tableBody;
    } else {
      errorNotification("HTTP-Error: " + response.status);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message);
  }
}

function removeUserRow(userId) {
  const userRow = document.getElementById(`user-${userId}`);
  if (userRow) {
    userRow.remove();
  }
}
// Select the Add User form
const addUserForm = document.getElementById("addUserForm");

// Show Modal Event Listener
document.getElementById("modal_show").addEventListener("click", () => {
  const modalElement = document.getElementById("addUserModal");
  if (modalElement) {
    console.log("Modal found:", modalElement);
  } else {
    console.error("Modal element not found!");
  }
});

// Handle Add User Form Submission
addUserForm.onsubmit = async (e) => {
  e.preventDefault(); // Prevent default form submission behavior

  // Get form values
  const formData = {
    firstname: document.getElementById("firstname").value,
    middle_name: document.getElementById("middle_name").value,
    lastname: document.getElementById("lastname").value,
    brgy: document.getElementById("brgy").value,
    email: document.getElementById("email").value,
    phone_number: document.getElementById("phone_number").value,
    birthdate: document.getElementById("birthdate").value,
    role: document.getElementById("role").value,
    password: document.getElementById("password").value,
    password_confirmation: document.getElementById("password_confirmation")
      .value,
  };

  try {
    // Show spinner or disable button
    const saveButton = addUserForm.querySelector("button[type='submit']");
    saveButton.disabled = true;
    saveButton.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"></div> Saving...`;

    // Send POST request to add user
    const response = await fetch(`${backendURL}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const json = await response.json();
      successNotification("User added successfully!");
      addUserForm.reset(); // Clear the form

      // Close modal if it exists
      const modalInstance = bootstrap.Modal.getInstance(
        document.getElementById("addUserModal")
      );
      if (modalInstance) modalInstance.hide();

      fetchBhw(); // Refresh the table
    } else {
      const errorJson = await response.json();
      errorNotification(`Error: ${errorJson.message}`);
    }
  } catch (error) {
    console.error("Error adding user:", error);
    errorNotification("An error occurred while adding the user.");
  } finally {
    // Restore button state
    const saveButton = addUserForm.querySelector("button[type='submit']");
    saveButton.disabled = false;
    saveButton.innerHTML = "Save";
  }
};
