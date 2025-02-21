import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import userimg from '../assets/user.png';
import './EditProfile.css';
export const EditProfile = () => {
      const user = {
        name: "John Doe",
        email: "johndoe@example.com",
        phone: "+1234567890",
        address: "123 Street, City, Country",
        balance: "$1,250.00",
        avatar: userimg,
      };
      const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission (e.g., update user info)
        console.log("Form submitted!");
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
          src={user.avatar}
          alt="User Avatar"
          className="edit-profile-img-card"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'fallback-image-url';
          }}
        />
      </div>
      <div className="edit-profile-card-back">
      <button className="Btn">Edit 
      <svg className="svg" viewBox="0 0 512 512">
        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path></svg>
    </button>


      </div>
    </div>
  </div>

  {/* User Info Card */}
  <div className="edit-profile-user-info-card">
                <h2>Edit User Information</h2>
                <form onSubmit={handleSubmit} className="edit-profile-form">
                  <div className="edit-profile-form-group">
                    <label htmlFor="name" className="edit-profile-form-label">
                      Name:
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue={user.name}
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
                      defaultValue={user.email}
                      className="edit-profile-form-input"
                    />
                  </div>
                  <div className="edit-profile-form-group">
                    <label htmlFor="phone" className="edit-profile-form-label">
                      Phone:
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      defaultValue={user.phone}
                      className="edit-profile-form-input"
                    />
                  </div>
                  <div className="edit-profile-form-group">
                    <label htmlFor="address" className="edit-profile-form-label">
                      Address:
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      defaultValue={user.address}
                      className="edit-profile-form-input"
                    />
                  </div>
                  <button type="submit" className="edit-profile-form-submit">
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Right Column: Balance Card and Who to Follow Card */}
              <div className="edit-profile-right-column">
                {/* Balance Card */}
                {/* Add your balance card here if needed */}

                {/* Project Card */}
                {/* Add your project card here if needed */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
export default EditProfile;