const API_URL = 'http://localhost:5000/invoices';

const getInvoiceByProject = async (projectId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const invoices = await response.json();
    return invoices;
  } catch (error) {
    console.error('Error fetching invoices by project:', error.message);
    throw error;
  }
};

export default {
  getInvoiceByProject,
};