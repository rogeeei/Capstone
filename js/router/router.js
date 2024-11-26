function setRouter() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Debugging logs to check the values
  console.log('Token:', token);
  console.log('Role:', role);

  // If user is logged in, redirect to dashboard if on login or register page
  if ((window.location.pathname === "/" || window.location.pathname === "/login.html" || window.location.pathname === "/register.html") && token) {
    window.location.pathname = "/dashboard.html";
    return; // Exit early to prevent further checks
  }
  
  // If user is not logged in, redirect to home page if accessing protected pages
  if (!token && (
    window.location.pathname === "/dashboard.html" || 
    window.location.pathname === "/citizen.html" || 
    window.location.pathname === "/history.html" || 
    window.location.pathname === "/supplies.html" || 
    window.location.pathname === "/admin.html" ||
    window.location.pathname === "/bhw.html" || 
    window.location.pathname === "/profiling.html" || 
    window.location.pathname === "/services.html"
  )) {
    window.location.pathname = "/";
    return; // Exit early to prevent further checks
  }
}

export { setRouter };
