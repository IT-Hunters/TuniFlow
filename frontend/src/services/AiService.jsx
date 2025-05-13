import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/recommendation';

const recommendationService = {
  async getPrediction(userId, token = null) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/predict`,
        { userId },
        config
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching prediction:', error.message);
      throw error.response?.data?.error || error.message;
    }
  },

  async getProjectRecommendation(projectId, token = null) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/project`,
        { projectId },
        config
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching project recommendation:', error.message);
      throw error.response?.data?.error || error.message;
    }
  },

  async getPriorityPrediction(userId, token = null) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/priority`,
        { userId },
        config
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching priority prediction:', error.message);
      throw error.response?.data?.error || error.message;
    }
  },

  async getSpendingBehaviorPrediction(userId, token = null) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/spending-behavior`,
        { userId },
        config
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching spending behavior prediction:', error.message);
      throw error.response?.data?.error || error.message;
    }
  },
};

export default recommendationService;