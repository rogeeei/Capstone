import {
  backendURL,
  successNotification,
  errorNotification,
} from "../utils/utils.js";

// Form Register
const form_register = document.getElementById("form_register");

form_register.onsubmit = async (e) => {
  e.preventDefault();

  // Disable Button
  const submitButton = document.querySelector("#form_register button");
  submitButton.disabled = true;
  submitButton.innerHTML = `<div class="spinner-border me-2" role="status"></div>`;

  // Get Values of Form (input, textarea, select) set it as form-data
  const formData = new FormData(form_register);

  // Inspect form data before sending
  for (const [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  try {
    // Fetch API User Register Endpoint
    const response = await fetch(backendURL + "/api/user", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    // Handle response based on status code
    if (response.ok) {
      const json = await response.json();

      form_register.reset();
      successNotification("Successfully registered account.", 5);

      // Redirect Page
      window.location.href = "/login.html";
    } else if (response.status == 422) {
      const json = await response.json();
      console.error("Validation errors:", json.errors); // Log validation errors
      errorNotification(json.message, 5);
    } else {
      errorNotification("An unexpected error occurred. Please try again.", 5);
    }
  } catch (error) {
    errorNotification("An error occurred: " + error.message, 5);
  } finally {
    // Enable Button
    submitButton.disabled = false;
    submitButton.innerHTML = `Send Request`;
  }
};
