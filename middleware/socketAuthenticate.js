const Boom = require("@hapi/boom");
const cookie = require("cookie");

// Utilities
const authenticateUser = require("../utils/authenticateUser");

const socketAuthenticate = async (socket, next) => {
  try {
    const authHeader = cookie.parse(socket.handshake.headers.cookie || "");

    if (!authHeader) {
      throw Boom.unauthorized("Access token is required");
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw Boom.unauthorized("Invalid authorization header");
    }

    socket.user = await authenticateUser(token);

    next();
  } catch (error) {
    return next(error || Boom.unauthorized("Invalid or expired access token"));
  }
};

module.exports = socketAuthenticate;
