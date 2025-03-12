import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});
  const [showFirstUpdateMessage, setShowFirstUpdateMessage] = useState(false);
  const [displayImage, setDisplayImage] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:3000/users/findMyProfile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Données utilisateur récupérées au chargement :', response.data);
        setUserData(response.data);
        setFormData(response.data);
        setDisplayImage(response.data.picture || null);
        console.log('displayImage initialisé avec :', response.data.picture || 'null');
        if (response.data.role === 'BUSINESS_OWNER' && response.data.isFirstUpdate) {
          setShowFirstUpdateMessage(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching profile data');
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
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
  
      if (!formData.fullname || !formData.lastname || !formData.email) {
        setError('Please fill in all required fields (Full Name, Last Name, Email).');
        return;
      }
  
      const cleanedFormData = {
        fullname: formData.fullname,
        lastname: formData.lastname,
        email: formData.email,
        picture: formData.picture && !formData.picture.startsWith('http') 
          ? `http://localhost:3000/images/${formData.picture}` 
          : formData.picture || '',
      };
  
      switch (userData.role) {
        case 'BUSINESS_OWNER':
          cleanedFormData.companyName = formData.companyName || '';
          cleanedFormData.registrationNumber = formData.registrationNumber ? Number(formData.registrationNumber) : undefined;
          cleanedFormData.industry = formData.industry || '';
          cleanedFormData.salary = formData.salary ? Number(formData.salary) : undefined;
          cleanedFormData.autorization = formData.autorization || false;
          cleanedFormData.evidence = formData.evidence || '';
          break;
        case 'BUSINESS_MANAGER':
          cleanedFormData.certification = formData.certification || '';
          cleanedFormData.experienceYears = formData.experienceYears ? Number(formData.experienceYears) : undefined;
          cleanedFormData.specialization = formData.specialization || '';
          cleanedFormData.salary = formData.salary ? Number(formData.salary) : undefined;
          
          break;
        case 'ACCOUNTANT':
          cleanedFormData.certification = formData.certification || '';
          cleanedFormData.experienceYears = formData.experienceYears ? Number(formData.experienceYears) : undefined;
          cleanedFormData.specialization = formData.specialization || '';
          cleanedFormData.salary = formData.salary ? Number(formData.salary) : undefined;
          
          break;
        case 'FINANCIAL_MANAGER':
          cleanedFormData.department = formData.department || '';
          cleanedFormData.salary = formData.salary ? Number(formData.salary) : undefined;
          cleanedFormData.hireDate = formData.hireDate || '';
          cleanedFormData.firstlogin = formData.firstlogin || false;
          break;
        case 'RH':
          cleanedFormData.certification = formData.certification || '';
          cleanedFormData.experienceYears = formData.experienceYears ? Number(formData.experienceYears) : undefined;
          cleanedFormData.specialization = formData.specialization || '';
          cleanedFormData.salary = formData.salary ? Number(formData.salary) : undefined;
          cleanedFormData.firstlogin = formData.firstlogin || false;
          break;
        case 'ADMIN':
          cleanedFormData.adminId = formData.adminId || '';
          break;
        default:
          break;
      }
  
      console.log('Données envoyées à updateprofile :', JSON.stringify(cleanedFormData, null, 2));
  
      const response = await axios.put('http://localhost:3000/users/updateprofile', cleanedFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      console.log('Réponse serveur :', response.data);
      alert('Profile updated successfully!');
      setShowFirstUpdateMessage(false);
      navigate('/profile');
    } catch (err) {
      console.error('Erreur complète :', err);
      if (err.response) {
        console.log('Réponse serveur :', err.response.data);
        setError(err.response.data.message || JSON.stringify(err.response.data));
      } else {
        setError('Erreur réseau ou serveur injoignable');
      }
    }
  };

 const handleImageUpload = (e) => {
  console.log('Événement onChange déclenché');
  const file = e.target.files[0];
  if (!file) {
    setError('No file selected');
    console.log('Aucun fichier sélectionné');
    return;
  }

  console.log('Fichier sélectionné :', file.name, file.size);
  const reader = new FileReader();
  reader.onloadend = () => {
    console.log('Aperçu local généré :', reader.result.substring(0, 50) + '...');
    setDisplayImage(reader.result);
    console.log('displayImage mis à jour avec aperçu :', reader.result.substring(0, 50) + '...');
  };
  reader.onerror = () => {
    console.error('Erreur lors de la lecture du fichier');
    setError('Error reading file');
  };
  reader.readAsDataURL(file);

  const imageFormData = new FormData();
  imageFormData.append('picture', file);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      return;
    }

    console.log('Début de l’upload vers le serveur');
    axios.put('http://localhost:3000/users/uploadimage', imageFormData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(response => {
      console.log('Réponse serveur après upload (complet) :', response.data);
      const imagePath = response.data.picture || response.data.data?.picture;
      console.log('Chemin brut reçu :', imagePath);
      const imageUrl = imagePath.startsWith('http') 
        ? imagePath 
        : `http://localhost:3000/images/${imagePath}`;
      console.log('URL construite :', imageUrl);
      
      setUserData((prevState) => ({
        ...prevState,
        picture: imageUrl,
      }));
      setFormData((prevState) => ({
        ...prevState,
        picture: imageUrl,
      }));
      setDisplayImage(imageUrl);
      console.log('displayImage mis à jour avec URL serveur :', imageUrl);

      const updatedProfile = {
        fullname: formData.fullname || '',
        lastname: formData.lastname || '',
        email: formData.email || '',
        picture: imageUrl,
      };
      switch (userData.role) {
        case 'BUSINESS_OWNER':
          updatedProfile.companyName = formData.companyName || '';
          updatedProfile.registrationNumber = formData.registrationNumber ? Number(formData.registrationNumber) : undefined;
          updatedProfile.industry = formData.industry || '';
          updatedProfile.salary = formData.salary ? Number(formData.salary) : undefined;
          updatedProfile.autorization = formData.autorization || false;
          updatedProfile.evidence = formData.evidence || '';
          break;
        case 'BUSINESS_MANAGER':
          updatedProfile.certification = formData.certification || '';
          updatedProfile.experienceYears = formData.experienceYears ? Number(formData.experienceYears) : undefined;
          updatedProfile.specialization = formData.specialization || '';
          updatedProfile.salary = formData.salary ? Number(formData.salary) : undefined;
          updatedProfile.firstlogin = formData.firstlogin || false;
          break;
        case 'ACCOUNTANT':
          updatedProfile.certification = formData.certification || '';
          updatedProfile.experienceYears = formData.experienceYears ? Number(formData.experienceYears) : undefined;
          updatedProfile.specialization = formData.specialization || '';
          updatedProfile.salary = formData.salary ? Number(formData.salary) : undefined;
          updatedProfile.firstlogin = formData.firstlogin || false;
          break;
        case 'FINANCIAL_MANAGER':
          updatedProfile.department = formData.department || '';
          updatedProfile.salary = formData.salary ? Number(formData.salary) : undefined;
          updatedProfile.hireDate = formData.hireDate || '';
          updatedProfile.firstlogin = formData.firstlogin || false;
          break;
        case 'RH':
          updatedProfile.certification = formData.certification || '';
          updatedProfile.experienceYears = formData.experienceYears ? Number(formData.experienceYears) : undefined;
          updatedProfile.specialization = formData.specialization || '';
          updatedProfile.salary = formData.salary ? Number(formData.salary) : undefined;
          updatedProfile.firstlogin = formData.firstlogin || false;
          break;
        case 'ADMIN':
          updatedProfile.adminId = formData.adminId || '';
          break;
        default:
          break;
      }

      console.log('Données envoyées à updateprofile :', JSON.stringify(updatedProfile, null, 2));
      axios.put('http://localhost:3000/users/updateprofile', updatedProfile, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).then(updateResponse => {
        console.log('Profil mis à jour avec l’image :', updateResponse.data);
      }).catch(updateErr => {
        console.error('Erreur lors de la mise à jour du profil :', updateErr);
        console.log('Détails de la réponse serveur :', updateErr.response?.data);
        setError('Failed to save image URL to profile');
      });

      setError('');
    }).catch(err => {
      console.error('Erreur complète lors de l’upload :', err);
      if (err.response) {
        setError(err.response.data.message || 'Error uploading image');
        setDisplayImage(null);
      } else {
        setError('Network error or server unreachable');
      }
    });
  } catch (err) {
    console.error('Erreur inattendue :', err);
  }
};
  const renderRoleSpecificFields = () => {
    switch (userData.role) {
      case 'ADMIN':
        return (
          <div className="edit-profile-form-group">
            <label htmlFor="adminId" className="edit-profile-form-label">Admin ID:</label>
            <input
              type="text"
              id="adminId"
              name="adminId"
              value={formData.adminId || ''}
              onChange={handleChange}
              className="edit-profile-form-input"
            />
          </div>
        );
      case 'BUSINESS_OWNER':
        return (
          <>
            <div className="edit-profile-form-group">
              <label htmlFor="companyName" className="edit-profile-form-label">Company Name:</label>
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
              <label htmlFor="registrationNumber" className="edit-profile-form-label">Registration Number:</label>
              <input
                type="number"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber || ''}
                onChange={handleChange}
                className="edit-profile-form-input"
              />
            </div>
            <div className="edit-profile-form-group">
              <label htmlFor="industry" className="edit-profile-form-label">Industry:</label>
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
              <label htmlFor="salary" className="edit-profile-form-label">Salary:</label>
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
              <label htmlFor="autorization" className="edit-profile-form-label">Authorization:</label>
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
              <label htmlFor="evidence" className="edit-profile-form-label">Evidence:</label>
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
              <label htmlFor="certification" className="edit-profile-form-label">Certification:</label>
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
              <label htmlFor="experienceYears" className="edit-profile-form-label">Experience Years:</label>
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
              <label htmlFor="specialization" className="edit-profile-form-label">Specialization:</label>
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
              <label htmlFor="salary" className="edit-profile-form-label">Salary:</label>
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
              <label htmlFor="firstlogin" className="edit-profile-form-label">First Login:</label>
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
              <label htmlFor="department" className="edit-profile-form-label">Department:</label>
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
              <label htmlFor="salary" className="edit-profile-form-label">Salary:</label>
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
              <label htmlFor="hireDate" className="edit-profile-form-label">Hire Date:</label>
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
              <label htmlFor="firstlogin" className="edit-profile-form-label">First Login:</label>
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
              <label htmlFor="certification" className="edit-profile-form-label">Certification:</label>
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
              <label htmlFor="experienceYears" className="edit-profile-form-label">Experience Years:</label>
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
              <label htmlFor="specialization" className="edit-profile-form-label">Specialization:</label>
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
              <label htmlFor="salary" className="edit-profile-form-label">Salary:</label>
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
              <label htmlFor="firstlogin" className="edit-profile-form-label">First Login:</label>
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
              <label htmlFor="certification" className="edit-profile-form-label">Certification:</label>
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
              <label htmlFor="experienceYears" className="edit-profile-form-label">Experience Years:</label>
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
              <label htmlFor="specialization" className="edit-profile-form-label">Specialization:</label>
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
              <label htmlFor="salary" className="edit-profile-form-label">Salary:</label>
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
              <label htmlFor="firstlogin" className="edit-profile-form-label">First Login:</label>
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-text">{error}</div>;
  if (!userData) return <div>No user data available</div>;

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
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="User Avatar"
                        className="edit-profile-img-card"
                        key={displayImage}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          console.log('Erreur de chargement de l’image');
                        }}
                        onLoad={() => console.log('Image chargée avec succès')}
                      />
                    ) : (
                      <div className="no-image-placeholder">No image uploaded</div>
                    )}
                  </div>
                  <div className="edit-profile-card-back">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/png, image/jpg, image/jpeg"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="image-upload"
                      className="edit-image-btn"
                      onClick={() => console.log('Clic sur le label Edit')}
                    >
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
                {showFirstUpdateMessage && (
                  <div className="first-update-message" style={{ color: 'blue', marginBottom: '10px' }}>
                    Welcome! Please complete your profile by adding your company name, registration number, and industry.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="edit-profile-form">
                  <div className="edit-profile-form-group">
                    <label htmlFor="fullname" className="edit-profile-form-label">Full Name:</label>
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
                    <label htmlFor="lastname" className="edit-profile-form-label">Last Name:</label>
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
                    <label htmlFor="email" className="edit-profile-form-label">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="edit-profile-form-input"
                    />
                  </div>
                  {renderRoleSpecificFields()}
                  <button type="submit" className="edit-profile-form-submit">Save Changes</button>
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