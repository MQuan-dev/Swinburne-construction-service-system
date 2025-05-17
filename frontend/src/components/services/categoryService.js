import axios from "axios";

const API_URL = "http://localhost:8000/api/v1/category/";

const getCategories = () => axios.get(API_URL);
const getCategory = (id) => axios.get(`${API_URL}${id}/`);
const createCategory = (data) => axios.post(API_URL, data);
const updateCategory = (id, data) => axios.put(`${API_URL}${id}/`, data);
const deleteCategory = (id) => axios.delete(`${API_URL}${id}/`);

const categoryService = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;
