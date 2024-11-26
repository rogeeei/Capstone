import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

form_login.onsubmit = async (e) => {
  e.preventDefault();

  // Disable the login button and show a loading spinner
  const loginButton = document.querySelector("#form_login button");
  loginButton.disabled = true;
  loginButton.innerHTML = `<div class="spinner-border me-2" role="status"></div><span></span>`;

  const formData = new FormData(form_login);

  try {
    const response = await fetch(backendURL + "/api/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const json = await response.json(); // Parse the JSON response
    console.log("Response JSON:", json); // Debug: Log the response

    if (response.ok) {
      // If login is successful
      if (json.data && json.data.token && json.data.data) {
        const userData = json.data.data;

        if (userData.approved === false) {
          errorNotification("Your account is pending approval from the admin.");
        } else {
          localStorage.setItem("token", json.data.token);
          localStorage.setItem("role", userData.role);
          form_login.reset();
          successNotification("Successfully logged in.");
          window.location.replace("/dashboard.html");
        }
      } else {
        errorNotification("Login failed. Token or role not found.");
      }
    } else if (response.status === 401) {
      // Handle invalid credentials
      errorNotification(json.message || "Invalid username or password.");
    } else if (response.status === 403) {
      // Handle account pending approval
      errorNotification("Your account is pending approval by the admin.");
    } else if (response.status === 422) {
      console.log("Validation Errors:", json); // Log validation errors
      errorNotification(json.message || "Validation error occurred.");
    } else {
      errorNotification("An unexpected error occurred. Please try again.");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    errorNotification("An error occurred. Please try again.");
  } finally {
    // Re-enable the login button
    loginButton.disabled = false;
    loginButton.innerHTML = `Login`;
  }
};
