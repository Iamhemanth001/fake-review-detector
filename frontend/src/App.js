import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { 
  UploadCloud, CheckCircle, AlertTriangle, 
  FileText, Activity, ShieldAlert, RefreshCw,
  Search, Download, Cpu, Database, Network, GitMerge, Layout, Code
} from "lucide-react";
import "./App.css";

const loadingMessages = [
  "Analyzing review patterns...",
  "Running anomaly detection...",
  "Computing NLP vectors...",
  "Detecting suspicious activity..."
];

function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [results, setResults] = useState([]);
  
  // New State for Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All"); // 'All', 'Suspicious', 'Genuine'
  
  // Toasts
  const [toasts, setToasts] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 1500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!isLoading) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("fake-review-detector-production-cd23.up.railway.app", formData);
      setResults(response.data);
      addToast(`Successfully analyzed ${response.data.length} reviews.`, "success");
    } catch (error) {
      console.error("Error analyzing reviews:", error);
      addToast("Failed to analyze reviews. Backend might be offline.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    addToast("Generating CSV report...", "success");

    const headers = ["ID", "Review", "Similarity Score", "Confidence (%)", "Result"];
    const rows = results.map((item, index) => [
      `REV-${index + 1001}`,
      `"${item.review.replace(/"/g, '""')}"`, // escape quotes
      item.similarity_score.toFixed(4),
      item.confidence.toFixed(2),
      item.suspicious ? "Suspicious" : "Genuine"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fraud-analysis-report-${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Logic
  const filteredResults = results.filter((item) => {
    const matchesSearch = item.review.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === "All" ? true :
      filterType === "Suspicious" ? item.suspicious :
      !item.suspicious;
    
    return matchesSearch && matchesFilter;
  });

  // Stats Calculations
  const totalReviews = results.length;
  const suspiciousCount = results.filter(r => r.suspicious).length;
  const genuineCount = totalReviews - suspiciousCount;
  const fraudPercentage = totalReviews > 0 ? ((suspiciousCount / totalReviews) * 100).toFixed(1) : 0;

  // Chart Data Preparation
  const pieData = [
    { name: 'Genuine', value: genuineCount },
    { name: 'Suspicious', value: suspiciousCount }
  ];
  const COLORS = ['#10b981', '#ef4444'];

  const chartData = results.map((item, index) => ({
    id: `Rev ${index + 1}`,
    confidence: item.confidence,
    similarity: item.similarity_score * 100,
    status: item.suspicious ? 'Suspicious' : 'Genuine'
  }));

  return (
    <div className="dashboard-container">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </div>
        ))}
      </div>

      <header className="header">
        <h1>AI Fraud Detection Center</h1>
        <p>Enterprise Natural Language Processing & Anomaly Detection</p>
      </header>

      {/* Upload Section */}
      {!isLoading ? (
        <div 
          className={`glass-panel upload-section ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="file-input"
            accept=".csv"
          />
          <UploadCloud size={48} className="upload-icon" />
          <div className="upload-text">
            <h3>Drag & Drop CSV File</h3>
            <p>or click to browse your files</p>
          </div>
          
          {file && (
            <div className="selected-file">
              <FileText size={20} />
              <span>{file.name}</span>
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <button 
              className="btn-primary" 
              onClick={handleUpload}
              disabled={!file}
            >
              Analyze Reviews
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel loading-overlay">
          <div className="loader-core"></div>
          <div className="loading-text">{loadingMessages[loadingTextIndex]}</div>
        </div>
      )}

      {/* Model Information Panel (Always visible below upload or results) */}
      {results.length === 0 && !isLoading && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={20} className="model-info-icon"/> System Architecture
          </h3>
          <div className="model-info-grid">
            <div className="model-info-item">
              <Network size={20} className="model-info-icon" />
              <div className="model-info-text">
                <h4>Algorithm</h4>
                <p>Isolation Forest</p>
              </div>
            </div>
            <div className="model-info-item">
              <FileText size={20} className="model-info-icon" />
              <div className="model-info-text">
                <h4>NLP Technique</h4>
                <p>TF-IDF Vectorization</p>
              </div>
            </div>
            <div className="model-info-item">
              <GitMerge size={20} className="model-info-icon" />
              <div className="model-info-text">
                <h4>Similarity Method</h4>
                <p>Cosine Similarity</p>
              </div>
            </div>
            <div className="model-info-item">
              <Database size={20} className="model-info-icon" />
              <div className="model-info-text">
                <h4>Training Data</h4>
                <p>5000+ Reviews</p>
              </div>
            </div>
            <div className="model-info-item">
              <Code size={20} className="model-info-icon" />
              <div className="model-info-text">
                <h4>Backend Stack</h4>
                <p>Flask API (Python)</p>
              </div>
            </div>
            <div className="model-info-item">
              <Layout size={20} className="model-info-icon" />
              <div className="model-info-text">
                <h4>Frontend Stack</h4>
                <p>React Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && !isLoading && (
        <>
          {/* Stats Section */}
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div className="stat-icon total"><FileText size={24} /></div>
              <div className="stat-info">
                <h4>Total Reviews</h4>
                <p>{totalReviews}</p>
              </div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-icon suspicious"><AlertTriangle size={24} /></div>
              <div className="stat-info">
                <h4>Suspicious</h4>
                <p>{suspiciousCount}</p>
              </div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-icon genuine"><CheckCircle size={24} /></div>
              <div className="stat-info">
                <h4>Genuine</h4>
                <p>{genuineCount}</p>
              </div>
            </div>
            <div className="glass-panel stat-card">
              <div className="stat-icon fraud"><ShieldAlert size={24} /></div>
              <div className="stat-info">
                <h4>Fraud Rate</h4>
                <p>{fraudPercentage}%</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            <div className="glass-panel chart-card">
              <h3><Activity size={20} /> Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(20, 20, 40, 0.9)', border: '1px solid rgba(100, 100, 255, 0.2)' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel chart-card">
              <h3><Activity size={20} /> Confidence Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="id" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(20, 20, 40, 0.9)', border: '1px solid rgba(100, 100, 255, 0.2)' }}
                  />
                  <Line type="monotone" dataKey="confidence" stroke="#00f0ff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Search & Export Section */}
          <div className="controls-section">
            <div className="search-bar">
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search reviews..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select 
                className="filter-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Reviews</option>
                <option value="Genuine">Genuine Only</option>
                <option value="Suspicious">Suspicious Only</option>
              </select>

              <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={exportToCSV}>
                <Download size={18} />
                Export Report
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="results-header">
            <h2>Analysis Results</h2>
            <span style={{ color: 'var(--text-muted)' }}>Showing {filteredResults.length} of {results.length}</span>
          </div>
          
          {filteredResults.length > 0 ? (
            <div className="results-grid">
              {filteredResults.map((item, index) => {
                // Find original index for consistent ID numbering
                const originalIndex = results.findIndex(r => r === item);
                return (
                  <div 
                    key={originalIndex} 
                    className={`glass-panel review-card ${item.suspicious ? 'suspicious-card' : 'genuine-card'}`}
                  >
                    <div className="card-header">
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: REV-{originalIndex + 1001}</span>
                      {item.suspicious ? (
                        <span className="badge suspicious"><AlertTriangle size={14} /> Suspicious</span>
                      ) : (
                        <span className="badge genuine"><CheckCircle size={14} /> Genuine</span>
                      )}
                    </div>
                    
                    <div className="review-text">
                      "{item.review}"
                    </div>
                    
                    <div className="card-metrics">
                      <div className="metric">
                        <div className="metric-label">Similarity</div>
                        <div className="metric-value">{(item.similarity_score * 100).toFixed(1)}%</div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Confidence</div>
                        <div className="metric-value">{item.confidence.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Search size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <h3>No reviews found</h3>
              <p>Try adjusting your search query or filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;