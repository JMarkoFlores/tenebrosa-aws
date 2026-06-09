import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_URL,
});

export const getDashboardResumen = async () => {
  const response = await api.get("/api/dashboard/resumen");
  return response.data;
};

export const getProductosModulo = async () => {
  const response = await api.get("/api/productos/modulo");
  return response.data;
};
