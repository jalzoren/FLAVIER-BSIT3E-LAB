import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { 
  FaLock, FaUnlockAlt, FaUsers, FaSignOutAlt, 
  FaUserCircle, FaEnvelope, FaCalendarAlt, FaClock, FaExclamationTriangle,
  FaShieldAlt, FaArrowLeft, FaUserCheck
} from "react-icons/fa";
import "../css/AdminDashboard.css";

function AdminDashboard() {
  const [lockedUsers, setLockedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('locked');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const adminUsername = location.state?.username || 'jalgorithm';

  // SweetAlert configuration
  const swalConfig = {
    success: {
      icon: 'success',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Continue',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    },
    error: {
      icon: 'error',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Try Again',
    },
    warning: {
      icon: 'warning',
      background: '#ffffff',
      color: '#1e293b',
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'OK',
    },
    loading: {
      title: 'Loading...',
      text: 'Please wait while we fetch data',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    }
  };

  useEffect(() => {
    if (adminUsername !== 'jalgorithm') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'Only jalgorithm can access the admin dashboard!'
      }).then(() => navigate('/'));
      return;
    }
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    
    // Show loading for data fetch
    Swal.fire({
      ...swalConfig.loading,
      title: activeTab === 'locked' ? 'Loading locked accounts...' : 'Loading all users...',
      text: 'Please wait while we fetch the data'
    });
    
    try {
      if (activeTab === 'locked') {
        await fetchLockedAccounts();
      } else {
        await fetchAllUsers();
      }
      Swal.close();
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        ...swalConfig.error,
        title: 'Error',
        text: 'Failed to fetch data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLockedAccounts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/locked-accounts?adminUsername=${adminUsername}`);
      setLockedUsers(response.data.lockedUsers || []);
    } catch (error) {
      if (error.response?.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Unauthorized',
          text: 'Only jalgorithm can view locked accounts!'
        }).then(() => navigate('/'));
      } else {
        throw error;
      }
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/all-users?adminUsername=${adminUsername}`);
      setAllUsers(response.data.users || []);
    } catch (error) {
      if (error.response?.status === 403) {
        Swal.fire({
          icon: 'error',
          title: 'Unauthorized',
          text: 'Only jalgorithm can view all users!'
        }).then(() => navigate('/'));
      } else {
        throw error;
      }
    }
  };

  const unlockAccount = async (userId, username) => {
    const result = await Swal.fire({
      title: 'Unlock Account?',
      text: `Are you sure you want to unlock ${username}'s account?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      cancelButtonText: 'Cancel',
            confirmButtonText: 'Yes, unlock it!'

    });

    if (result.isConfirmed) {
      // Show loading while unlocking
      Swal.fire({
        title: 'Unlocking...',
        text: `Please wait while we unlock ${username}'s account`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        await axios.put(`http://localhost:5000/api/auth/unlock-account/${userId}`, {
          adminUsername: adminUsername
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Account Unlocked!',
          text: `${username}'s account has been unlocked successfully`,
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#1e293b'
        });
        
        // Refresh data
        if (activeTab === 'locked') {
          fetchLockedAccounts();
        } else {
          fetchAllUsers();
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Unlock Failed',
          text: error.response?.data?.message || 'Failed to unlock account. Please try again.',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

const handleLogout = () => {
  Swal.fire({
    title: 'Logout?',
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    cancelButtonText: 'Cancel',
        confirmButtonText: 'Yes, logout'

  }).then((result) => {
    if (result.isConfirmed) {
      navigate('/');
    }
  });
};  

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getStatusBadge = (isLocked) => {
    return isLocked ? 
      <span className="corp-badge corp-badge-locked"><FaLock /> Locked</span> : 
      <span className="corp-badge corp-badge-active"><FaUnlockAlt /> Active</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="corp-admin-container">
      <button onClick={handleLogout} className="corp-logout-btn">
        <FaSignOutAlt /> Logout
      </button>

      <div className="corp-main-wrapper">
        <div className="corp-dashboard-card">
          {/* Header */}
          <div className="corp-header">
            <div className="corp-title-section">
              <h1><FaShieldAlt /> Admin Dashboard</h1>
              <p>Manage user accounts and security</p>
            </div>
            <div className="corp-admin-info">
              <span className="corp-admin-name">Welcome, {adminUsername}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="corp-tabs">
            <button 
              className={`corp-tab ${activeTab === 'locked' ? 'active' : ''}`}
              onClick={() => handleTabChange('locked')}
            >
              <FaLock /> Locked Accounts ({lockedUsers.length})
            </button>
            <button 
              className={`corp-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <FaUsers /> All Users ({allUsers.length})
            </button>
          </div>

          {/* Content */}
          <div className="corp-content">
            {loading ? (
              <div className="corp-loading">
                <div className="corp-spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : (
              <>
                {activeTab === 'locked' && (
                  <div className="corp-section">
                    <h2>Locked Accounts</h2>
                    {lockedUsers.length === 0 ? (
                      <div className="corp-empty">
                        <FaUserCheck className="corp-empty-icon" />
                        <p>No locked accounts found</p>
                        <span>All accounts are active</span>
                      </div>
                    ) : (
                      <div className="corp-table-wrapper">
                        <table className="corp-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Username</th>
                              <th>Email</th>
                              <th>Failed Attempts</th>
                              <th>Locked Date</th>
                              <th>Last Login</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lockedUsers.map(user => (
                              <tr key={user.id} className="corp-locked-row">
                                <td>{user.id}</td>
                                <td><strong>{user.username}</strong></td>
                                <td>{user.email}</td>
                                <td><span className="corp-attempts">{user.login_attempts}/3</span></td>
                                <td>{formatDate(user.locked_until)}</td>
                                <td>{formatDate(user.last_login)}</td>
                                <td>
                                  <button 
                                    onClick={() => unlockAccount(user.id, user.username)}
                                    className="corp-unlock-btn"
                                  >
                                    <FaUnlockAlt /> Unlock
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'all' && (
                  <div className="corp-section">
                    <h2>All Users</h2>
                    {allUsers.length === 0 ? (
                      <div className="corp-empty">
                        <FaUsers className="corp-empty-icon" />
                        <p>No users found</p>
                      </div>
                    ) : (
                      <div className="corp-table-wrapper">
                        <table className="corp-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Username</th>
                              <th>Email</th>
                              <th>Status</th>
                              <th>Failed Attempts</th>
                              <th>Registered</th>
                              <th>Last Login</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allUsers.map(user => (
                              <tr key={user.id} className={user.account_locked ? 'corp-locked-row' : ''}>
                                <td>{user.id}</td>
                                <td><strong>{user.username}</strong></td>
                                <td>{user.email}</td>
                                <td>{getStatusBadge(user.account_locked)}</td>
                                <td>{user.login_attempts}/3</td>
                                <td>{formatDate(user.created_at)}</td>
                                <td>{formatDate(user.last_login)}</td>
                                <td>
                                  {user.account_locked && (
                                    <button 
                                      onClick={() => unlockAccount(user.id, user.username)}
                                      className="corp-unlock-btn"
                                    >
                                      <FaUnlockAlt /> Unlock
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="corp-modal" onClick={() => setSelectedUser(null)}>
          <div className="corp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="corp-modal-header">
              <h2><FaUserCircle /> User Details</h2>
              <button className="corp-modal-close" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="corp-modal-body">
              <div className="corp-detail-row">
                <span>Username:</span>
                <strong>{selectedUser.username}</strong>
              </div>
              <div className="corp-detail-row">
                <span>Email:</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div className="corp-detail-row">
                <span>Status:</span>
                {getStatusBadge(selectedUser.account_locked)}
              </div>
              <div className="corp-detail-row">
                <span>Failed Attempts:</span>
                <strong className={selectedUser.login_attempts >= 2 ? 'corp-warning' : ''}>
                  {selectedUser.login_attempts}/3
                </strong>
              </div>
              <div className="corp-detail-row">
                <span>Account Locked:</span>
                <strong>{selectedUser.account_locked ? 'Yes' : 'No'}</strong>
              </div>
              <div className="corp-detail-row">
                <span>Locked Until:</span>
                <strong>{formatDate(selectedUser.locked_until)}</strong>
              </div>
              <div className="corp-detail-row">
                <span>Last Login:</span>
                <strong>{formatDate(selectedUser.last_login)}</strong>
              </div>
              <div className="corp-detail-row">
                <span>Registered:</span>
                <strong>{formatDate(selectedUser.created_at)}</strong>
              </div>
              {selectedUser.account_locked && (
                <button 
                  onClick={() => {
                    unlockAccount(selectedUser.id, selectedUser.username);
                    setSelectedUser(null);
                  }}
                  className="corp-unlock-btn-full"
                >
                  <FaUnlockAlt /> Unlock This Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;