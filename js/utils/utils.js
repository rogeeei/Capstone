import { setRouter } from "../router/router.js";

// Set Router
setRouter();

// Backend URL
const backendURL = "http://healthy-barrio-backend.test";

// Function to handle response
async function handleResponse(response) {
  if (response.ok) {
    const json = await response.json();

    // Update user ID
    if (document.getElementById("user_id")) {
      document.getElementById("user_id").value = json.id;
    }
  } else {
    const json = await response.json();
    errorNotification(json.message, 10);
  }
}

// Show Admin Pages Navigation
function showNavAdminPages() {
  const role = localStorage.getItem("role");

  // Get the navigation container
  const navContainer = document.getElementById("nav_admin_pages");

  // Check if the user is an admin
  if (role === "admin") {
    // Admin links
    navContainer.innerHTML = `
      <a class="nav-link" href="reports.html">
        <div class="sb-nav-link-icon"><i class="fa-solid fa-file"></i></div>
        View Reports
      </a>
      <a class="nav-link dropdown-toggle" href="#" id="userManagementDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        <div class="sb-nav-link-icon"><i class="fas fa-users"></i></div>
        User Management
      </a>
      <ul class="dropdown-menu" aria-labelledby="userManagementDropdown">
        <li><a class="dropdown-item" href="bhw.html">BHW</a></li>
        <li><a class="dropdown-item" href="admin.html">Admin</a></li>
      </ul>
    `;
  }
}

// Success Notification
// Success Notification
function successNotification(message, timeout = 5) {
  const notificationElement = document.getElementById("successNotification");
  if (!notificationElement) {
    console.error("Notification element not found.");
    return;
  }

  notificationElement.textContent = message;
  notificationElement.style.display = "block";

  setTimeout(() => {
    notificationElement.classList.add("show");
  }, 10); // Trigger CSS transition

  setTimeout(() => {
    notificationElement.classList.remove("show");
    setTimeout(() => {
      notificationElement.style.display = "none";
    }, 500); // Wait for transition to complete
  }, timeout * 1000);
}

// Error Notification
function errorNotification(message, timeout = 5) {
  const notificationElement = document.getElementById("errorNotification");
  if (!notificationElement) {
    console.error("Notification element not found.");
    return;
  }

  notificationElement.textContent = message;
  notificationElement.style.display = "block";

  setTimeout(() => {
    notificationElement.classList.add("show");
  }, 10); // Trigger CSS transition

  setTimeout(() => {
    notificationElement.classList.remove("show");
    setTimeout(() => {
      notificationElement.style.display = "none";
    }, 500); // Wait for transition to complete
  }, timeout * 1000);
}

// Fetch user details and update side navigation
async function fetchUserDetails() {
  const token = localStorage.getItem("token");

  if (!token) {
    errorNotification("User is not authenticated.");
    return;
  }

  try {
    const response = await fetch(`${backendURL}/api/user-details`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = await response.json();

    if (response.ok) {
      updateSideNav(userData);
    } else {
      errorNotification(userData.message, 10);
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    errorNotification("An error occurred while fetching user details.", 10);
  }
}

function updateSideNav(userData) {
  if (!userData) {
    console.error("No user data available.");
    return;
  }

  // Update the barangay address
  const barangayName = document.getElementById("barangay-name");
  if (barangayName && userData.barangay) {
    // Check if the element and userData.barangay exist
    barangayName.innerHTML = `<strong>Brgy. ${userData.barangay}</strong>`; // Make "Brgy." bold
  }

  // Update the user name (first name + last name)
  const userID = document.getElementById("user_logged");
  if (userID && userData.firstname && userData.lastname) {
    userID.textContent = `${userData.firstname} ${userData.lastname}`;
  }

  // Optionally update the profile image
  const userImage = document.querySelector("#layoutSidenav_nav img");
  if (userImage && userData.profile_picture) {
    userImage.src = userData.profile_picture;
  }
}

// Initialize user data
document.addEventListener("DOMContentLoaded", () => {
  fetchUserDetails();
});

export {
  backendURL,
  showNavAdminPages,
  successNotification,
  errorNotification,
  fetchUserDetails,
  updateSideNav,
};
