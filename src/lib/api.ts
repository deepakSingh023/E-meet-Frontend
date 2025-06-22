import axios from 'axios';
import { Product } from '../types/product';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api.com';

// Fetch all products
export const fetchAllProducts = async (): Promise<Product[]> => {
  const response = await axios.get(`${BASE_URL}/products`);
  return response.data;
};

// Fetch one product by ID
export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`${BASE_URL}/products/${id}`);
  return response.data;
};
