import axios from 'axios';

const API_URL = 'https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev';

const api = axios.create({
  baseURL: API_URL
});