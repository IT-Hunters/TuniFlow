import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // important si tu utilises des cookies ou JWT
});

export default instance;
