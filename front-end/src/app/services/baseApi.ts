import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
export const bitescoutApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Critical for cookies
});
