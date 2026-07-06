import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './index.css'

function App() {
  const [patients, setPatients] = useState([])
  const [donors, setDonors] = useState([])
  const [activeTab, setActiveTab] = useState('registry') // 'registry', 'registerPatient', 'registerDonor'
  const [viewMode, setViewMode] = useState('public') // 'public', 'hospital'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const API_URL = 'http://localhost:3001/api'

  useEffect(() => {
    fetchRegistry()
  }, [])

  const fetchRegistry = async () => {
    try {
      const res = await fetch(`${API_URL}/registry`)
      const data = await res.json()
      if (data.patients && data.donors) {
        setPatients(data.patients)
        setDonors(data.donors)
      }
    } catch (err) {
      console.error("Failed to fetch registry", err)
    }
  }

  const handleRegisterPatient = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const formData = new FormData(e.target)
    const payload = {
      nationalId: formData.get('nationalId'),
      name: formData.get('name'),
      neededOrgan: parseInt(formData.get('neededOrgan')),
      bloodType: parseInt(formData.get('bloodType')),
      urgencyScore: parseInt(formData.get('urgencyScore'))
    }

    try {
      const res = await fetch(`${API_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ text: 'Patient registered successfully!', type: 'success' })
        e.target.reset()
        fetchRegistry()
      } else {
        setMessage({ text: data.error || 'Failed to register', type: 'error' })
      }
    } catch (err) {
      console.error("RAW ERROR IN POST /api/patients:", err);
      setMessage({ text: `Server error: ${err.message}`, type: 'error' })
    }
    setLoading(false)
  }

  const handleRegisterDonor = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    const formData = new FormData(e.target)
    const payload = {
      name: formData.get('name'),
      donatedOrgan: parseInt(formData.get('donatedOrgan')),
      bloodType: parseInt(formData.get('bloodType'))
    }

    try {
      const res = await fetch(`${API_URL}/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ text: 'Donor registered successfully!', type: 'success' })
        e.target.reset()
        fetchRegistry()
      } else {
        setMessage({ text: data.error || 'Failed to register', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Server error', type: 'error' })
    }
    setLoading(false)
  }

  const organs = ['Heart', 'Liver', 'Kidney', 'Lungs', 'Pancreas', 'Intestines']
  const bloodTypes = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

  return (
    <div className="app-container">
      <header className="glass-panel">
        <div className="logo">
          <h1>Bio-Chain</h1>
          <p>Decentralized Organ Donation Ledger</p>
        </div>
        <div className="view-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={viewMode === 'hospital'}
              onChange={() => {
                const newMode = viewMode === 'public' ? 'hospital' : 'public';
                setViewMode(newMode);
                if (newMode === 'public') setActiveTab('registry');
              }}
            />
            <span className="slider"></span>
          </label>
          <span className={`mode-label ${viewMode}`}>{viewMode === 'hospital' ? 'Staff View' : 'Public View'}</span>
        </div>
        <nav>
          <button
            className={activeTab === 'registry' ? 'active' : ''}
            onClick={() => setActiveTab('registry')}>
            Public Registry
          </button>
          {viewMode === 'hospital' && (
            <>
              <button
                className={activeTab === 'registerPatient' ? 'active' : ''}
                onClick={() => setActiveTab('registerPatient')}>
                Add Patient
              </button>
              <button
                className={activeTab === 'registerDonor' ? 'active' : ''}
                onClick={() => setActiveTab('registerDonor')}>
                Register Donor
              </button>
            </>
          )}
        </nav>
      </header>

      <main>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'registry' && (
          <div className="registry-section animation-fade-in">
            <h2>Immutable Waiting List & Donors</h2>

            <div className="tables-container">
              <div className="table-wrapper glass-panel">
                <h3>Patients Waiting</h3>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>National ID</th>
                      <th>Needed Organ</th>
                      <th>Blood Type</th>
                      <th>Urgency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 && <tr><td colSpan="5">No patients found.</td></tr>}
                    {patients.map(p => (
                      <tr key={p[0] || p.id}>
                        <td>{p[0] || p.id}</td>
                        <td>{viewMode === 'public' ? 'Anonymous Patient' : (p[2] || p.name)}</td>
                        <td>{viewMode === 'public' ? '***-' + String(p[3] || p.nationalId || 'XXXX').slice(-4) : (p[3] || p.nationalId || 'N/A')}</td>
                        <td>{organs[p[4] !== undefined ? p[4] : p.neededOrgan]}</td>
                        <td>{bloodTypes[p[5] !== undefined ? p[5] : p.bloodType]}</td>
                        <td>{p[6] !== undefined ? p[6] : p.urgencyScore} / 100</td>
                        <td>
                          {p[8] === true || p.isMatched ? (
                            <span className="badge matched">Matched (Donor #{p[9] !== undefined ? p[9] : p.matchedDonorId})</span>
                          ) : (
                            <span className="badge waiting">Waiting</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-wrapper glass-panel">
                <h3>Registered Donors</h3>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Donated Organ</th>
                      <th>Blood Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.length === 0 && <tr><td colSpan="5">No donors found.</td></tr>}
                    {donors.map(d => (
                      <tr key={d[0] || d.id}>
                        <td>{d[0] || d.id}</td>
                        <td>{viewMode === 'public' ? 'Anonymous Donor' : (d[2] || d.name)}</td>
                        <td>{organs[d[3] || d.donatedOrgan]}</td>
                        <td>{bloodTypes[d[4] || d.bloodType]}</td>
                        <td>
                          {d[6] === true || d.isMatched ? (
                            <span className="badge matched">Matched (Patient #{d[7] !== undefined ? d[7] : d.matchedPatientId})</span>
                          ) : (
                            <span className="badge waiting">Available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'registerPatient' && (
          <div className="form-section glass-panel animation-slide-up">
            <h2>Add Patient to Waiting List</h2>
            <form onSubmit={handleRegisterPatient}>
              <div className="form-group">
                <label>National ID (Unique Identifier)</label>
                <input type="text" name="nationalId" required placeholder="e.g. 123456789" />
              </div>
              <div className="form-group">
                <label>Patient Name</label>
                <input type="text" name="name" required placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label>Needed Organ</label>
                <select name="neededOrgan" required>
                  {organs.map((org, idx) => <option key={idx} value={idx}>{org}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Blood Type</label>
                <select name="bloodType" required>
                  {bloodTypes.map((bt, idx) => <option key={idx} value={idx}>{bt}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Medical Urgency Score (1-100)</label>
                <input type="number" name="urgencyScore" required min="1" max="100" placeholder="e.g. 50" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing...' : 'Add Patient via Smart Contract'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'registerDonor' && (
          <div className="form-section glass-panel animation-slide-up">
            <h2>Register as a Donor</h2>
            <form onSubmit={handleRegisterDonor}>
              <div className="form-group">
                <label>Donor Name</label>
                <input type="text" name="name" required placeholder="Enter full name" />
              </div>
              <div className="form-group">
                <label>Donated Organ</label>
                <select name="donatedOrgan" required>
                  {organs.map((org, idx) => <option key={idx} value={idx}>{org}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Blood Type</label>
                <select name="bloodType" required>
                  {bloodTypes.map((bt, idx) => <option key={idx} value={idx}>{bt}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing...' : 'Register Donor via Smart Contract'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
