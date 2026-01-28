import { useState, useEffect } from 'react'
import { LogOut, Users, Phone, Mail, Calendar, Filter, Search, X, Eye, EyeOff } from 'lucide-react'
import './Admin.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [activeTab, setActiveTab] = useState('leads') // 'leads', 'availability', or 'users'
  const [availability, setAvailability] = useState({})
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ name: '', password: '' })
  const [userError, setUserError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null) // For viewing other users' availability
  const [currentUsername, setCurrentUsername] = useState('')

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const refresh = localStorage.getItem('refreshToken')
    const username = localStorage.getItem('currentUsername')
    if (token && refresh && username) {
      setAccessToken(token)
      setRefreshToken(refresh)
      setCurrentUsername(username)
      setIsLoggedIn(true)
      fetchLeads(token)
      fetchUsers(token)
      loadAvailability(username, token)
    }
  }, [])

  // Load availability when selected user changes
  useEffect(() => {
    if (selectedUser && accessToken) {
      loadAvailability(selectedUser, accessToken)
    }
  }, [selectedUser])

  // Fetch users
  const fetchUsers = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token || accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Add new user
  const addUser = async (e) => {
    e.preventDefault()
    setUserError('')

    if (!newUser.name.trim() || !newUser.password.trim()) {
      setUserError('Name and password are required')
      return
    }

    if (newUser.password.length < 8) {
      setUserError('Password must be at least 8 characters')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        await fetchUsers()
        setNewUser({ name: '', password: '' })
        alert('User added successfully')
      } else {
        const data = await response.json()
        setUserError(data.error || 'Failed to add user')
      }
    } catch (error) {
      setUserError('Error adding user')
      console.error('Error adding user:', error)
    }
  }

  // Load availability from backend for specific user
  const loadAvailability = async (username, token) => {
    try {
      const user = username || selectedUser || currentUsername
      if (!user) return
      
      const authToken = token || accessToken
      if (!authToken) return
      
      const response = await fetch(`${API_URL}/api/availability/${encodeURIComponent(user)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAvailability(data.availability || {})
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    }
  }

  // Save availability to backend for current user
  const saveAvailability = async (newAvailability) => {
    try {
      setAvailability(newAvailability)
      
      const response = await fetch(`${API_URL}/api/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ availability: newAvailability })
      })
      
      if (!response.ok) {
        console.error('Failed to save availability')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
    }
  }

  // Toggle availability for a time slot (3-state: unset → available → unavailable → unset)
  const toggleAvailability = (day, time) => {
    const key = `${day}-${time}`
    const currentState = availability[key] || 'unset'
    let newState
    
    // Cycle: unset → available → unavailable → unset
    if (currentState === 'unset') {
      newState = 'available'
    } else if (currentState === 'available') {
      newState = 'unavailable'
    } else {
      newState = 'unset'
    }
    
    const newAvailability = { ...availability, [key]: newState }
    saveAvailability(newAvailability)
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeSlots = [
    '6:00 AM - 7:00 AM',
    '7:00 AM - 8:00 AM',
    '8:00 AM - 9:00 AM',
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '7:00 PM - 8:00 PM',
    '8:00 PM - 9:00 PM'
  ]

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!refreshToken) return

    // Refresh token every 14 minutes (before 15min expiry)
    const interval = setInterval(async () => {
      await refreshAccessToken()
    }, 14 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshToken])

  // Filter leads based on search and filters
  useEffect(() => {
    let filtered = leads

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(lead => lead.type === filterType)
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus)
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, filterType, filterStatus])

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (response.ok) {
        const data = await response.json()
        setAccessToken(data.accessToken)
        localStorage.setItem('accessToken', data.accessToken)
        return data.accessToken
      } else {
        // Refresh token expired, logout
        handleLogout()
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      handleLogout()
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        setAccessToken(data.accessToken)
        setRefreshToken(data.refreshToken)
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        localStorage.setItem('currentUsername', loginData.username)
        setCurrentUsername(loginData.username)
        setIsLoggedIn(true)
        setError('')
        fetchLeads(data.accessToken)
        fetchUsers(data.accessToken)
        loadAvailability(loginData.username, data.accessToken)
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (accessToken && refreshToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ refreshToken })
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setAccessToken(null)
      setRefreshToken(null)
      setIsLoggedIn(false)
      setLeads([])
      setFilteredLeads([])
    }
  }

  const fetchLeads = async (token = accessToken) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      } else if (response.status === 403 || response.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshAccessToken()
        if (newToken) {
          fetchLeads(newToken)
        }
      } else {
        setError('Failed to fetch leads')
      }
    } catch (error) {
      setError('Error connecting to server')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update local state
        setLeads(leads.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ))
      }
    } catch (error) {
      console.error('Error updating lead:', error)
    }
  }



  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return '#ff6b35'
      case 'contacted': return '#ffd700'
      case 'converted': return '#4caf50'
      case 'rejected': return '#f44336'
      default: return '#666'
    }
  }

  const getTypeLabel = (type) => {
    switch(type) {
      case 'demo_request': return 'Demo Request'
      case 'contact_form': return 'Contact Form'
      default: return type
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-header">
            <h1>Chess Architects Academy</h1>
            <h2>Admin Login</h2>
          </div>
          
          <form onSubmit={handleLogin} className="admin-login-form">
            {error && <div className="admin-error">{error}</div>}
            
            <div className="admin-form-group">
              <input
                type="text"
                placeholder="Username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                required
              />
            </div>
            
            <div className="admin-form-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="admin-login-btn">
              Login
            </button>
          </form>
          
          <div className="admin-login-footer">
            <p>Default Credentials:</p>
            <p>Username: <strong>admin</strong> | Password: <strong>chess@2026</strong></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>CRM Dashboard</h1>
          <div className="admin-header-actions">
            <div className="admin-tabs">
              <button 
                className={`admin-tab ${activeTab === 'leads' ? 'active' : ''}`}
                onClick={() => setActiveTab('leads')}
              >
                Leads
              </button>
              <button 
                className={`admin-tab ${activeTab === 'availability' ? 'active' : ''}`}
                onClick={() => setActiveTab('availability')}
              >
                Availability
              </button>
              <button 
                className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'leads' && (
        <>
          {/* Stats Cards */}
          <div className="admin-stats">
        <div className="admin-stat-card">
          <Users size={24} />
          <div>
            <h3>{leads.length}</h3>
            <p>Total Leads</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <Phone size={24} />
          <div>
            <h3>{leads.filter(l => l.type === 'demo_request').length}</h3>
            <p>Demo Requests</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <Mail size={24} />
          <div>
            <h3>{leads.filter(l => l.type === 'contact_form').length}</h3>
            <p>Contact Forms</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <Calendar size={24} />
          <div>
            <h3>{leads.filter(l => l.status === 'new').length}</h3>
            <p>New Leads</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-filter-group">
          <Filter size={18} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="demo_request">Demo Requests</option>
            <option value="contact_form">Contact Forms</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>

          <button onClick={fetchLeads} className="admin-refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="admin-no-data">No leads found</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Level</th>
                <th>Status</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="lead-date">{formatDate(lead.timestamp)}</td>
                  <td className="lead-name">{lead.name}</td>
                  <td className="lead-contact">
                    <div className="contact-info">
                      <span className="phone"><Phone size={14} /> {lead.phone}</span>
                      {lead.email && <span className="email"><Mail size={14} /> {lead.email}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`lead-type-badge ${lead.type}`}>
                      {getTypeLabel(lead.type)}
                    </span>
                  </td>
                  <td>{lead.level || '-'}</td>
                  <td>
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className="status-select"
                      style={{ borderColor: getStatusColor(lead.status) }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="lead-message">
                    {lead.message ? (
                      <span title={lead.message}>
                        {lead.message.length > 50 ? lead.message.substring(0, 50) + '...' : lead.message}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="lead-actions">
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi ${lead.name}, this is Chess Architects Academy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn whatsapp-btn"
                          title="WhatsApp"
                        >
                          <Phone size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
        </>
      )}

      {activeTab === 'availability' && (
        <div className="availability-section">
          <div className="availability-header">
            <h2>Weekly Availability Schedule</h2>
            <p>Click on time slots to toggle: Unset → Available (Green) → Unavailable (Red) → Unset</p>
            
            <div className="user-selector">
              <label>View Availability For:</label>
              <select 
                value={selectedUser || currentUsername} 
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value={currentUsername}>{currentUsername} (You)</option>
                {users.filter(u => u.name !== currentUsername).map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="availability-grid-container">
            <div className="availability-grid">
              <div className="availability-grid-header">
                <div className="time-cell header-cell"></div>
                {days.map(day => (
                  <div key={day} className="day-header header-cell">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="availability-grid-body">
                {timeSlots.map((time, timeIndex) => (
                  <div key={time} className="availability-row">
                    <div className="time-cell">{time}</div>
                    {days.map(day => {
                      const key = `${day}-${time}`
                      const state = availability[key] || 'unset'
                      const isViewingOwnSchedule = !selectedUser || selectedUser === currentUsername
                      return (
                        <div
                          key={key}
                          className={`availability-cell ${state} ${!isViewingOwnSchedule ? 'read-only' : ''}`}
                          onClick={() => isViewingOwnSchedule && toggleAvailability(day, time)}
                          title={`${day} ${time}: ${state}${!isViewingOwnSchedule ? ' (Read-only)' : ''}`}
                        >
                          {state === 'available' && '✓'}
                          {state === 'unavailable' && '✗'}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="availability-legend">
            <h3>Legend:</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-box available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-box unavailable"></div>
                <span>Unavailable</span>
              </div>
              <div className="legend-item">
                <div className="legend-box unset"></div>
                <span>Not Set</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="users-section">
          <div className="users-header">
            <h2>User Management</h2>
            <p>Manage admin users who can access the admin panel</p>
          </div>

          <div className="add-user-form">
            <h3>Add New User</h3>
            {userError && <div className="error-message">{userError}</div>}
            <form onSubmit={addUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password (min 8 characters)</label>
                <input
                  type="password"
                  placeholder="Enter secure password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" className="btn-primary">Add User</button>
            </form>
          </div>

          <div className="users-list">
            <h3>Existing Users ({users.length})</h3>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name">
                          <Users size={16} />
                          {user.name}
                        </div>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
