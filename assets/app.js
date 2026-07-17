const legacyRoutes = {
  product: "#public/product",
  modules: "#public/features",
  login: "#customer/customer-dashboard",
  customer: "#customer/customer-dashboard"
};

document.addEventListener("DOMContentLoaded", () => {
  const route = legacyRoutes[document.body.dataset.page] || "#public/home";
  location.replace(`index.html${route}`);
});
