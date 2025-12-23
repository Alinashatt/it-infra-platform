export function isAuthenticated(req, res, next) { // middleware to check if user is authenticated
  if (req.session.user) {
    return next();
  }
  res.redirect("/login");
}
