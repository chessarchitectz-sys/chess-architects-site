import { useState, useEffect } from 'react'
import { LogOut, Users, Phone, Mail, Calendar, Filter, Search, X } from 'lucide-react'
import './Admin.css'

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

  // Check if already logged in
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (adminToken === 'chess-admin-logged-in') {
      setIsLoggedIn(true)
      fetchLeads()
    }
  }, [])

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

  const handleLogin = (e) => {
    e.preventDefault()
    // Admin credentials (you should change these)
    if (loginData.username === 'admin' && loginData.password === 'chess@2026') {
      localStorage.setItem('adminToken', 'chess-admin-logged-in')
      setIsLoggedIn(true)
      setError('')
      fetchLeads()
    } else {
      setError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsLoggedIn(false)
    setLeads([])
    setFilteredLeads([])
  }

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
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
      const response = await fetch(`http://localhost:3001/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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

  const deleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const response = await fetch(`http://localhost:3001/api/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLeads(leads.filter(lead => lead.id !== leadId))
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
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
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
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
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

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
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-btn whatsapp-btn"
                        title="WhatsApp"
                      >
                        <Phone size={16} />
                      </a>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Admin
