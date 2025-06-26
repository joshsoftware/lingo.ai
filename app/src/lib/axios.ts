// Creating common axios client for api calls
import axios from "axios";

export const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
