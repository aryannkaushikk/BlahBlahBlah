const BASE_URLS = {
  dev: {
    ROOM_SERVICE: "http://localhost:5800",
    CHAT_SERVICE: "http://localhost:8080",
    MESSAGE_SERVICE: "http://localhost:5600",
  },
  prod: {
    ROOM_SERVICE: import.meta.env.VITE_ROOM_SERVICE_URL,
    CHAT_SERVICE: import.meta.env.VITE_CHAT_SERVICE_URL,
    MESSAGE_SERVICE: import.meta.env.VITE_MESSAGE_SERVICE_URL,
  },
};

const ENV = import.meta.env.MODE === "development" ? "dev" : "prod";

export const ROOM_SERVICE_URL = BASE_URLS[ENV].ROOM_SERVICE;
export const CHAT_SERVICE_URL = BASE_URLS[ENV].CHAT_SERVICE;
export const MESSAGE_SERVICE_URL = BASE_URLS[ENV].MESSAGE_SERVICE;
