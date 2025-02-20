import './profile.css'


const ViewProfile = () => {
    const user = {
      name: "John Doe",
      email: "johndoe@example.com",
      phone: "+1234567890",
      address: "123 Street, City, Country",
      balance: "$1,250.00",
      avatar: "https://via.placeholder.com/150",
    };
  
    return (
      <div className="profile-container flex justify-center items-start gap-6 p-6">
        {/* Profile Image */}
        <div className="profile-card w-1/4 p-4 flex justify-center items-center">
          <img className="avatar w-32 h-32 rounded-full" src={user.avatar} alt="User Avatar" />
        </div>
  
        {/* User Info */}
        <div className="profile-card w-1/2 p-4">
          <div className="profile-content">
            <h2 className="text-xl font-semibold mb-2">User Information</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
            <p><strong>Address:</strong> {user.address}</p>
          </div>
        </div>
  
        {/* User Balance */}
        <div className="profile-card w-1/4 p-4 text-center">
          <div className="profile-content">
            <h2 className="text-xl font-semibold mb-2">Balance</h2>
            <p className="text-2xl font-bold text-green-600">{user.balance}</p>
          </div>
        </div>
      </div>
    );
  };
  
  export default ViewProfile;
  