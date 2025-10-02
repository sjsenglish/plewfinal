// src/components/AdminAccess.js
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { usePaywall } from '../hooks/usePaywall';
import { useNavigate } from 'react-router-dom';
import './AdminAccess.css';

const AdminAccess = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const { isAdmin, loading: paywallLoading, subscription } = usePaywall();
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pendingEmails, setPendingEmails] = useState([]);

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Wait for paywall hook to finish loading
    if (paywallLoading) {
      return;
    }
    
    // Check admin access after paywall data is loaded
    console.log('Checking admin access for:', user.email);
    console.log('isAdmin from paywall:', isAdmin);
    console.log('Subscription data:', subscription);
    
    if (!isAdmin) {
      // Double-check with email
      const adminEmails = ['sjahn101@gmail.com'];
      if (adminEmails.includes(user.email?.toLowerCase())) {
        console.log('User email is in admin list, granting access');
        setLoading(false);
        fetchUsersWithAccess();
      } else {
        alert('Access denied. Admin privileges required.');
        navigate('/');
      }
    } else {
      setLoading(false);
      fetchUsersWithAccess();
    }
  }, [user, isAdmin, navigate, paywallLoading, subscription]);

  // Fetch all users with full access
  const fetchUsersWithAccess = async () => {
    setRefreshing(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('subscription.status', '==', 'active'),
        orderBy('subscription.updatedAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const usersData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.subscription?.fullAccess || data.subscription?.status === 'active' || data.isAdmin) {
          usersData.push({
            uid: doc.id,
            email: data.email || 'N/A',
            plan: data.subscription?.plan || 'N/A',
            status: data.subscription?.status || 'N/A',
            isAdmin: data.isAdmin || false,
            role: data.role || 'user',
            activatedAt: data.subscription?.activatedAt || data.createdAt,
            paymentType: data.subscription?.paymentType || 'N/A'
          });
        }
      });
      
      // Also fetch admin users who might not have active subscriptions
      const adminQuery = query(
        usersRef,
        where('isAdmin', '==', true),
        limit(50)
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      adminSnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if not already in list
        if (!usersData.find(u => u.uid === doc.id)) {
          usersData.push({
            uid: doc.id,
            email: data.email || 'N/A',
            plan: 'admin',
            status: 'active',
            isAdmin: true,
            role: data.role || 'admin',
            activatedAt: data.createdAt,
            paymentType: 'admin_grant'
          });
        }
      });
      
      // Fetch pending emails from allowlist
      const allowlistRef = collection(db, 'allowedEmails');
      const allowlistSnapshot = await getDocs(allowlistRef);
      const pendingEmailsList = [];
      
      allowlistSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') {
          pendingEmailsList.push({
            email: data.email,
            grantedBy: data.grantedBy,
            grantedAt: data.grantedAt
          });
        }
      });
      
      setPendingEmails(pendingEmailsList);
      setUsers(usersData);
      setMessage({ type: 'info', text: `Found ${usersData.length} users with full access and ${pendingEmailsList.length} pending emails` });
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setRefreshing(false);
    }
  };

  // Grant access to a user by UID or email
  const grantAccess = async () => {
    if (!inputValue.trim()) {
      setMessage({ type: 'error', text: 'Please enter a Firebase UID or email' });
      return;
    }
    
    setGranting(true);
    setMessage({ type: '', text: '' });
    
    try {
      let userId = null;
      let userEmail = null;
      
      // Check if input is an email
      if (inputValue.includes('@')) {
        userEmail = inputValue.trim();
        
        // Search for user by email in users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          userId = querySnapshot.docs[0].id;
        } else {
          // Add email to allowlist for when they sign up
          const allowlistRef = doc(db, 'allowedEmails', userEmail.replace(/\./g, '_'));
          await setDoc(allowlistRef, {
            email: userEmail,
            grantedBy: user.uid,
            grantedAt: new Date().toISOString(),
            status: 'pending',
            accessLevel: 'full'
          });
          
          setMessage({ 
            type: 'success', 
            text: `Email ${userEmail} added to allowlist. They will get full access when they sign up.` 
          });
          setInputValue('');
          fetchUsersWithAccess();
          setGranting(false);
          return;
        }
      } else {
        // Assume it's a UID
        userId = inputValue.trim();
        
        // Verify the user exists
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setMessage({ type: 'error', text: 'User with this UID not found' });
          setGranting(false);
          return;
        }
        userEmail = userDoc.data().email || 'N/A';
      }
      
      // Update user document to grant full access
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscription: {
          status: 'active',
          plan: 'admin_granted',
          fullAccess: true,
          paymentType: 'admin_grant',
          grantedBy: user.uid,
          grantedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        isAdmin: false, // Don't make them admin, just give full access
        updatedAt: new Date()
      });
      
      setMessage({ 
        type: 'success', 
        text: `Successfully granted full access to ${userEmail} (${userId})` 
      });
      
      setInputValue('');
      
      // Refresh the users list
      fetchUsersWithAccess();
      
    } catch (error) {
      console.error('Error granting access:', error);
      setMessage({ type: 'error', text: `Failed to grant access: ${error.message}` });
    } finally {
      setGranting(false);
    }
  };

  // Revoke access from a user
  const revokeAccess = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to revoke access from ${userEmail}?`)) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          subscription: {
            status: 'inactive',
            plan: 'free',
            fullAccess: false,
            revokedBy: user.uid,
            revokedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          isAdmin: false,
          updatedAt: new Date()
        });
        
        setMessage({ 
          type: 'success', 
          text: `Successfully revoked access from ${userEmail}` 
        });
        
        // Refresh the users list
        fetchUsersWithAccess();
      } catch (error) {
        console.error('Error revoking access:', error);
        setMessage({ type: 'error', text: `Failed to revoke access: ${error.message}` });
      }
    }
  };

  // Make user an admin
  const makeAdmin = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to make ${userEmail} an admin? This grants them full system access.`)) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isAdmin: true,
          role: 'admin',
          subscription: {
            status: 'active',
            plan: 'admin',
            fullAccess: true,
            paymentType: 'admin_grant',
            updatedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        });
        
        setMessage({ 
          type: 'success', 
          text: `Successfully made ${userEmail} an admin` 
        });
        
        // Refresh the users list
        fetchUsersWithAccess();
      } catch (error) {
        console.error('Error making admin:', error);
        setMessage({ type: 'error', text: `Failed to make admin: ${error.message}` });
      }
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-access-loading">
        <div className="spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="admin-access-container">
      <div className="admin-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        <h1>Admin Access Management</h1>
        <div className="admin-info">
          Logged in as: {user?.email}
        </div>
      </div>

      <div className="admin-content">
        {/* Grant Access Section */}
        <div className="grant-access-section">
          <h2>Grant Full Access</h2>
          <p className="section-description">
            Enter a Firebase UID or email address to grant full subscription access
          </p>
          
          <div className="grant-access-form">
            <input
              type="text"
              placeholder="Enter Firebase UID or email address"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && grantAccess()}
              disabled={granting}
              className="access-input"
            />
            <button 
              onClick={grantAccess}
              disabled={granting || !inputValue.trim()}
              className="grant-button"
            >
              {granting ? 'Granting...' : 'Grant Access'}
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Users List Section */}
        <div className="users-list-section">
          <div className="section-header">
            <h2>Users with Full Access ({filteredUsers.length})</h2>
            <button 
              onClick={fetchUsersWithAccess}
              disabled={refreshing}
              className="refresh-button"
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search by email, UID, or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Firebase UID</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Activated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userData) => (
                  <tr key={userData.uid} className={userData.isAdmin ? 'admin-user' : ''}>
                    <td>{userData.email}</td>
                    <td className="uid-cell">
                      <span className="uid-text">{userData.uid}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(userData.uid);
                          setMessage({ type: 'info', text: 'UID copied to clipboard' });
                        }}
                        className="copy-button"
                        title="Copy UID"
                      >
                        📋
                      </button>
                    </td>
                    <td>
                      <span className={`plan-badge plan-${userData.plan}`}>
                        {userData.plan}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${userData.status}`}>
                        {userData.status}
                      </span>
                    </td>
                    <td>{userData.paymentType}</td>
                    <td>
                      {userData.activatedAt ? 
                        new Date(userData.activatedAt).toLocaleDateString() : 
                        'N/A'
                      }
                    </td>
                    <td>
                      {!userData.isAdmin && userData.paymentType === 'admin_grant' && (
                        <>
                          <button 
                            onClick={() => revokeAccess(userData.uid, userData.email)}
                            className="action-button revoke-button"
                            title="Revoke Access"
                          >
                            Revoke
                          </button>
                          <button 
                            onClick={() => makeAdmin(userData.uid, userData.email)}
                            className="action-button admin-button"
                            title="Make Admin"
                          >
                            Make Admin
                          </button>
                        </>
                      )}
                      {userData.isAdmin && (
                        <span className="admin-badge">System Admin</span>
                      )}
                      {userData.paymentType !== 'admin_grant' && !userData.isAdmin && (
                        <span className="paid-badge">Paid User</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="no-users">
                {searchTerm ? 'No users found matching your search' : 'No users with full access found'}
              </div>
            )}
          </div>
        </div>

        {/* Pending Emails Section */}
        {pendingEmails.length > 0 && (
          <div className="pending-emails-section">
            <h2>Pending Access Grants ({pendingEmails.length})</h2>
            <p className="section-description">
              These emails will receive full access when they sign up
            </p>
            <div className="pending-emails-list">
              {pendingEmails.map((pending, index) => (
                <div key={index} className="pending-email-item">
                  <span className="pending-email">{pending.email}</span>
                  <span className="pending-date">
                    Added {new Date(pending.grantedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccess;