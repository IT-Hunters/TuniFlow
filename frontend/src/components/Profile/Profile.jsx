import './profile.css';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';
import userimg from '../assets/user.png';

const ViewProfile = () => {
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    phone: "+1234567890",
    address: "123 Street, City, Country",
    balance: "$1,250.00",
    avatar: userimg,
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

              <div className="profile-user-info-card">
                <button className="profile-Btn">
                  Edit
                  <svg className="profile-svg" viewBox="0 0 512 512">
                    <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                  </svg>
                </button>
                <h2>User Information</h2>
                <p><strong>Name:</strong> John Doe</p>
                
                <p><strong>Email:</strong> johndoe@example.com</p>
                <p><strong>Phone:</strong> +1234567890</p>
                <p><strong>Address:</strong> 123 Street, City, Country</p>
              </div>

              <div className="profile-balance-card-new">
                <div className="profile-title">
                  <span>
                    <svg width="20" fill="currentColor" height="20" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1362 1185q0 153-99.5 263.5t-258.5 136.5v175q0 14-9 23t-23 9h-135q-13 0-22.5-9.5t-9.5-22.5v-175q-66-9-127.5-31t-101.5-44.5-74-48-46.5-37.5-17.5-18q-17-21-2-41l103-135q7-10 23-12 15-2 24 9l2 2q113 99 243 125 37 8 74 8 81 0 142.5-43t61.5-122q0-28-15-53t-33.5-42-58.5-37.5-66-32-80-32.5q-39-16-61.5-25t-61.5-26.5-62.5-31-56.5-35.5-53.5-42.5-43.5-49-35.5-58-21-66.5-8.5-78q0-138 98-242t255-134v-180q0-13 9.5-22.5t22.5-9.5h135q14 0 23 9t9 23v176q57 6 110.5 23t87 33.5 63.5 37.5 39 29 15 14q17 18 5 38l-81 146q-8 15-23 16-14 3-27-7-3-3-14.5-12t-39-26.5-58.5-32-74.5-26-85.5-11.5q-95 0-155 43t-60 111q0 26 8.5 48t29.5 41.5 39.5 33 56 31 60.5 27 70 27.5q53 20 81 31.5t76 35 75.5 42.5 62 50 53 63.5 31.5 76.5 13 94z"></path>
                    </svg>
                  </span>
                  <p className="profile-title-text">Balance</p>
                </div>
                <div className="profile-data">
                  <p>{user.balance}</p>
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