import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import userimg from '../assets/user.png';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null); // State to store user data
  const [loading, setLoading] = useState(true); // State for loading state
  const [error, setError] = useState(''); // State for error handling
  const [formData, setFormData] = useState({}); // State for form data

  useEffect(() => {
    // Fetch user data when the component mounts
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token'); // Get the token from localStorage
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:3000/users/findMyProfile', {
          headers: {
            Authorization: `Bearer ${token}`, // Attach the token to the request headers
          },
        });

        setUserData(response.data); // Set user data in state
        setFormData(response.data); // Initialize form data with user data
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching profile data');
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false); // Stop loading after the request completes
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        return;
      }
  
      // Basic validation for required fields
      if (!formData.fullname || !formData.lastname || !formData.email) {
        setError('Please fill in all required fields (Full Name, Last Name, Email).');
        return;
      }
  
      // Add logging here, before the axios.put call
      console.log('Submitting profile update with the following data:', {
        formData: formData,
        token: token,
      });
  
      // Update profile
      await axios.put('http://localhost:3000/users/updateprofile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      alert('Profile updated successfully!');
      navigate('/profile'); // Redirect to profile page after update
    } catch (err) {
      if (err.response) {
        // Server responded with a status other than 2xx
        setError(err.response.data.message || 'Error updating profile');
      } else if (err.request) {
        // No response received from server
        setError('No response from server. Please try again later.');
      } else {
        // Error setting up the request
        setError('An unexpected error occurred.');
      }
      console.error('Error updating profile:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageFormData = new FormData();
    imageFormData.append('picture', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        return;
      }

      const response = await axios.put('http://localhost:3000/users/uploadimage', imageFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserData((prevState) => ({
        ...prevState,
        picture: response.data.picture, // Update the picture URL in state
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading image');
      console.error('Error uploading image:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Loading state
  }

  if (error) {
    return <div className="error-text">{error}</div>; // Error state
  }

  if (!userData) {
    return <div>No user data available</div>; // No data state
  }

  // Function to render role-specific form fields
  const renderRoleSpecificFields = () => {
    switch (userData.role) {
      case 'ADMIN':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="adminId" className="edit-profile-form-label">
                Admin ID:
              </label>
              <input
                type="text"
                id="adminId"
                name="adminId"
                value={formData.adminId || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
          </>
        );
      case 'BUSINESS_OWNER':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="companyName" className="edit-profile-form-label">
                Company Name:
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="registrationNumber" className="edit-profile-form-label">
                Registration Number:
              </label>
              <input
                type="number" // Changed to number to match backend schema
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="industry" className="edit-profile-form-label">
                Industry:
              </label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="salary" className="edit-profile-form-label">
                Salary:
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="autorization" className="edit-profile-form-label">
                Authorization:
              </label>
              <input
                type="checkbox"
                id="autorization"
                name="autorization"
                checked={formData.autorization || false}
                onChange={(e) => setFormData({ ...formData, autorization: e.target.checked })}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="evidence" className="edit-profile-form-label">
                Evidence:
              </label>
              <input
                type="text"
                id="evidence"
                name="evidence"
                value={formData.evidence || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
          </>
        );
      case 'ACCOUNTANT':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="certification" className="edit-profile-form-label">
                Certification:
              </label>
              <input
                type="text"
                id="certification"
                name="certification"
                value={formData.certification || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="experienceYears" className="edit-profile-form-label">
                Experience Years:
              </label>
              <input
                type="number"
                id="experienceYears"
                name="experienceYears"
                value={formData.experienceYears || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="specialization" className="edit-profile-form-label">
                Specialization:
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="salary" className="edit-profile-form-label">
                Salary:
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="firstlogin" className="edit-profile-form-label">
                First Login:
              </label>
              <input
                type="checkbox"
                id="firstlogin"
                name="firstlogin"
                checked={formData.firstlogin || false}
                onChange={(e) => setFormData({ ...formData, firstlogin: e.target.checked })}
                className="edit-profile-form-input"
              />
            </div>
          </>
        );
      case 'FINANCIAL_MANAGER':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="department" className="edit-profile-form-label">
                Department:
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="salary" className="edit-profile-form-label">
                Salary:
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="hireDate" className="edit-profile-form-label">
                Hire Date:
              </label>
              <input
                type="date"
                id="hireDate"
                name="hireDate"
                value={formData.hireDate || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="firstlogin" className="edit-profile-form-label">
                First Login:
              </label>
              <input
                type="checkbox"
                id="firstlogin"
                name="firstlogin"
                checked={formData.firstlogin || false}
                onChange={(e) => setFormData({ ...formData, firstlogin: e.target.checked })}
                className="edit-profile-form-input"
              />
            </div>
          </>
        );
      case 'BUSINESS_MANAGER':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="certification" className="edit-profile-form-label">
                Certification:
              </label>
              <input
                type="text"
                id="certification"
                name="certification"
                value={formData.certification || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="experienceYears" className="edit-profile-form-label">
                Experience Years:
              </label>
              <input
                type="number"
                id="experienceYears"
                name="experienceYears"
                value={formData.experienceYears || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="specialization" className="edit-profile-form-label">
                Specialization:
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="salary" className="edit-profile-form-label">
                Salary:
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="firstlogin" className="edit-profile-form-label">
                First Login:
              </label>
              <input
                type="checkbox"
                id="firstlogin"
                name="firstlogin"
                checked={formData.firstlogin || false}
                onChange={(e) => setFormData({ ...formData, firstlogin: e.target.checked })}
                className="edit-profile-form-input"
              />
            </div>
          </>
        );
      case 'RH':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="certification" className="edit-profile-form-label">
                Certification:
              </label>
              <input
                type="text"
                id="certification"
                name="certification"
                value={formData.certification || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="experienceYears" className="edit-profile-form-label">
                Experience Years:
              </label>
              <input
                type="number"
                id="experienceYears"
                name="experienceYears"
                value={formData.experienceYears || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="specialization" className="edit-profile-form-label">
                Specialization:
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="salary" className="edit-profile-form-label">
                Salary:
              </label>
              <input
                type="number"
                id="salary"
                name="salary"
                value={formData.salary || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="firstlogin" className="edit-profile-form-label">
                First Login:
              </label>
              <input
                type="checkbox"
                id="firstlogin"
                name="firstlogin"
                checked={formData.firstlogin || false}
                onChange={(e) => setFormData({ ...formData, firstlogin: e.target.checked })}
                className="edit-profile-form-input"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="container">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="profile-container flex justify-center items-start gap-6 p-6">
            <div className="profile-cards-row">
              {/* Profile Image */}
              <div className="edit-profile-card">
                <div className="edit-profile-card-inner">
                  <div className="edit-profile-card-front">
                    <img
                      src={userData.picture || userimg} // Display user avatar or fallback image
                      alt="User Avatar"
                      className="edit-profile-img-card"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = userimg; // Fallback if image doesn't load
                      }}
                    />
                  </div>
                  <div className="edit-profile-card-back">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload" className="edit-image-btn">
                      Edit
                      <svg className="edit-image-svg" viewBox="0 0 512 512">
                        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                      </svg>
                    </label>
                  </div>
                </div>
              </div>

              {/* User Info Card */}
              <div className="edit-profile-user-info-card">
                <h2>Edit User Information</h2>
                <form onSubmit={handleSubmit} className="edit-profile-form">
                  <div className="edit-profile-form-group">
                    <label htmlFor="fullname" className="edit-profile-form-label">
                      Full Name:
                    </label>
                    <input
                      type="text"
                      id="fullname"
                      name="fullname"
                      value={formData.fullname || ''}
                      onChange={handleChange}
                      className="edit-profile-form-input"
                    />
                  </div>
                  <div className="edit-profile-form-group">
                    <label htmlFor="lastname" className="edit-profile-form-label">
                      Last Name:
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname || ''}
                      onChange={handleChange}
                      className="edit-profile-form-input"
                    />
                  </div>
                  <div className="edit-profile-form-group">
                    <label htmlFor="email" className="edit-profile-form-label">
                      Email:
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="edit-profile-form-input"
                    />
                  </div>
                  {/* Render role-specific fields */}
                  {renderRoleSpecificFields()}
                  <button type="submit" className="edit-profile-form-submit">
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProfile;