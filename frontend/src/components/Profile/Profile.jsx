import './profile.css';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import userimg from '../assets/user.png';
import { useNavigate } from 'react-router-dom';
const ViewProfile = () => {
  const navigate = useNavigate();
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    phone: "+1234567890",
    address: "123 Street, City, Country",
    balance: "$1,250.00",
    avatar: userimg,
  };
  const handleEditClick = () => {
    navigate('/profile/edit');
  }

  return (
    <>
      <div className="container">
        <Sidebar />
        <div className="main">
          <Navbar />
          <div className="profile-container flex justify-center items-start gap-6 p-6">
          <div className="profile-cards-row">
  {/* Profile Image */}
  <div className="profile-card">
    <div className="profile-card-inner">
      <div className="profile-card-front">
        <img
          src={user.avatar}
          alt="User Avatar"
          className="profile-img-card"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'fallback-image-url';
          }}
        />
      </div>
      <div className="profile-card-back">
        <h2>{user.name}</h2>
        <p>role</p>
      </div>
    </div>
  </div>

  {/* User Info Card */}
  <div className="profile-user-info-card">
  <button className="profile-Btn" onClick={handleEditClick}>
    Edit
    <svg className="profile-svg" viewBox="0 0 512 512">
      <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
    </svg>
  </button>
  <h2>User Information</h2>
  <ul className="profile-user-info-list">
    <li className="profile-user-info-item">
      <span className="profile-user-info-label">Name:</span>
      <span className="profile-user-info-value">{user.name}</span>
    </li>
    <li className="profile-user-info-item">
      <span className="profile-user-info-label">Email:</span>
      <span className="profile-user-info-value">{user.email}</span>
    </li>
    <li className="profile-user-info-item">
      <span className="profile-user-info-label">Phone:</span>
      <span className="profile-user-info-value">{user.phone}</span>
    </li>
    <li className="profile-user-info-item">
      <span className="profile-user-info-label">Address:</span>
      <span className="profile-user-info-value">{user.address}</span>
    </li>
  </ul>
</div>

  {/* Right Column: Balance Card and Who to Follow Card */}
  <div className="profile-right-column">
    {/* Balance Card */}
    <div className="balance-card">
      <p className="balance-card-title">Current Balance</p>
      <p className="balance">$12,345.67</p>
      <p className="balance-account">
        <svg width={20} height={20} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
          <rect width={22} height={16} x={1} y={4} rx={2} ry={2} />
          <path d="M1 10h22" />
        </svg>
        Account: **** **** **** 1234
      </p>
      <div className="balance-buttons">
        <a href="#" className="balance-button button-transfer">
          <svg width={16} height={16} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
          Transfer
        </a>
        <a href="#" className="balance-button button-save">
          <svg width={16} height={16} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-7h-2c0-1-.5-1.5-1-2h0V5z" />
            <path d="M13 5c-1 1.5-2 3-2 3" />
            <path d="M16 5c1 1.5 2 3 2 3" />
          </svg>
          Save
        </a>
      </div>
      <svg className="balance-dollar-sign" width={40} height={40} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </div>

      {/*Project Card */}
    <div className="project-card">
      <p className="project-title">Project List</p>
      <div className="project-user__container">
        <div className="project-user">
          <div className="project-user__content">
            <div className="project-text">
              <span className="project-name">Name</span>
              <p className="project-username">@namedlorem</p>
            </div>
            <button className="project-follow">Open</button>
          </div>
        </div>
        <div className="project-user">
          <div className="project-user__content">
            <div className="project-text">
              <span className="project-name">Name</span>
              <p className="project-username">@namedlorem</p>
            </div>
            <button className="project-follow">Open</button>
          </div>
        </div>
        <div className="project-user">
          <div className="project-user__content">
            <div className="project-text">
              <span className="project-name">Name</span>
              <p className="project-username">@namedlorem</p>
            </div>
            <button className="project-follow">Open</button>
          </div>
        </div>
      </div>
      <a className="project-more" href="#">See more</a>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewProfile;