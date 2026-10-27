const Boom = require("@hapi/boom");
const { Server } = require("socket.io");

// Middleware
const socketAuthenticate = require("../middleware/socketAuthenticate");

// Config
const { allowedOrigins } = require("./cors");

let io;

exports.socket = (server) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, Boolean(origin && allowedOrigins.includes(origin)));
    },
    maxHttpBufferSize: 1e6,
    allowEIO3: false,
    serveClient: false,
    pingInterval: 25000,
    pingTimeout: 30000,
    connectTimeout: 30000,
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    perMessageDeflate: false,
    httpCompression: false,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
  });

  io.use(socketAuthenticate);

  io.on("connection", (socket) => {
    const userId = String(socket.user?.id);

    socket.join(`user:${userId}`);
    console.log(`Socket connected: ${userId} (${socket.id})`);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("Socket initialized successfully".bgGreen.white);

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw Boom.internal("Socket has not been initialized");
  }

  return io;
};

exports.disconnectUserSockets = (userId) => {
  const io = exports.getIO();

  if (!userId) {
    throw Boom.badRequest("User ID is required");
  }

  io.in(`user:${String(userId)}`).disconnectSockets(true);
};

exports.emitToUser = (userId, event, payload) => {
  const io = exports.getIO();

  if (!userId) {
    throw Boom.badRequest("User ID is required");
  }

  if (!event || typeof event !== "string") {
    throw Boom.badRequest("Event is required");
  }

  io.to(`user:${String(userId)}`).emit(event, payload);
};

exports.emitToUsers = (userIds, event, payload) => {
  const io = exports.getIO();

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw Boom.badRequest("At least one user ID is required");
  }

  if (!event || typeof event !== "string") {
    throw Boom.badRequest("Event is required");
  }

  const rooms = [...new Set(userIds.filter((userId) => userId != null && String(userId).trim()).map((userId) => `user:${String(userId)}`))];

  if (rooms.length === 0) {
    throw Boom.badRequest("At least one user ID is required");
  }

  io.to(rooms).emit(event, payload);
};

exports.emitToRoom = (room, event, payload) => {
  const io = exports.getIO();

  if (typeof room !== "string" || !room.trim()) {
    throw Boom.badRequest("Room is required");
  }

  if (!event || typeof event !== "string") {
    throw Boom.badRequest("Event is required");
  }

  io.to(room).emit(event, payload);
};

exports.emitToAll = (event, payload) => {
  const io = exports.getIO();

  if (!event || typeof event !== "string") {
    throw Boom.badRequest("Event is required");
  }

  io.emit(event, payload);
};
