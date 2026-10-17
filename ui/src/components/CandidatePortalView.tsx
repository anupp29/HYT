import React, { useState } from 'react';
import { 
  Briefcase, 
  UploadCloud, 
  CheckCircle2, 
  Send, 
  FileText, 
  GitBranch, 
  Globe, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  UserCheck,
  Check,
  Clock,
  X,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Award,
  Upload
} from 'lucide-react';
import { JobDescription, CandidateRecord } from '../types/ats';
import { api } from '../services/api';

interface CandidatePortalViewProps {
  jobs: JobDescription[];
}

export const CandidatePortalView: React.FC<CandidatePortalViewProps> = ({ jobs }) => {
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobDescription | null>(null);
  
  // Application Form State
  const [candidateName, setCandidateName] = useState('Pooja Sharma');
  const [candidateEmail, setCandidateEmail] = useState('pooja.sharma@example.com');
  const [candidateExp, setCandidateExp] = useState(3.0);
  const [statement, setStatement] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<CandidateRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search in Browse Jobs
  const [browseSearch, setBrowseSearch] = useState('');

  // Sample application tracking records matching Screenshot 6
  const [myApplications, setMyApplications] = useState([
    {
      id: 'app-1',
      title: 'Software Engineer',
      company: 'TechNova Solutions',
      appliedOn: '12 Nov 2024',
      status: 'Shortlisted',
      score: '92%',
      statusColor: 'badge-success'
    },
    {
      id: 'app-2',
      title: 'Data Analyst',
      company: 'DataSense Analytics',
      appliedOn: '10 Nov 2024',
      status: 'Under Review',
      score: '76%',
      statusColor: 'badge-warning'
    },
    {
      id: 'app-3',
      title: 'Product Manager',
      company: 'InnoTech Labs',
      appliedOn: '5 Nov 2024',
      status: 'Not Shortlisted',
      score: '35%',
      statusColor: 'badge-danger'
    },
    {
      id: 'app-4',
      title: 'ML Engineer',
      company: 'AIWorks',
      appliedOn: '28 Oct 2024',
      status: 'Shortlisted',
      score: '88%',
      statusColor: 'badge-success'
    },
    {
      id: 'app-5',
      title: 'Backend Developer',
      company: 'CloudTech',
      appliedOn: '20 Oct 2024',
      status: 'Under Review',
      score: '68%',
      statusColor: 'badge-warning'
    }
  ]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForModal) return;

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('job_id', selectedJobForModal.job_id);
      formData.append('name', candidateName.trim());
      formData.append('email', candidateEmail.trim());
      formData.append('experience_years', candidateExp.toString());
      if (statement) formData.append('statement', statement.trim());
      if (resumeFile) formData.append('resume_file', resumeFile);

      const res = await api.applyCandidate(formData);
      setSubmissionFeedback(res);

      // Add to my applications
      setMyApplications(prev => [
        {
          id: `app-${Date.now()}`,
          title: selectedJobForModal.title,
          company: selectedJobForModal.company,
          appliedOn: 'Just now',
          status: res.stage === 'Shortlisted' ? 'Shortlisted' : 'Under Review',
          score: `${res.final_score}%`,
          statusColor: res.stage === 'Shortlisted' ? 'badge-success' : 'badge-warning'
        },
        ...prev
      ]);
    } catch (err: any) {
      setError(err.message || 'Application submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(browseSearch.toLowerCase()) ||
    j.company.toLowerCase().includes(browseSearch.toLowerCase()) ||
    j.must_have_skills.some(s => s.toLowerCase().includes(browseSearch.toLowerCase()))
  );

  return (
    <div style={{ padding: '1.5rem 2rem 3rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Candidate Greeting Header matching Screenshot 5 & 6 */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Hi Pooja! 👋
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Find your next opportunity with AI-powered job matching.
        </p>
      </div>

      {/* 2. Top 4 Metric Cards matching Screenshot 6 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem'
      }}>
        <div className="hyt-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Applications</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {myApplications.length}
          </div>
        </div>

        <div className="hyt-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Shortlisted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {myApplications.filter(a => a.status === 'Shortlisted').length}
          </div>
        </div>

        <div className="hyt-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Under Review</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {myApplications.filter(a => a.status === 'Under Review').length}
          </div>
        </div>

        <div className="hyt-card" style={{ padding: '1.125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Not Shortlisted</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {myApplications.filter(a => a.status === 'Not Shortlisted').length}
          </div>
        </div>
      </div>

      {/* 3. Browse Jobs Section matching Screenshot 6 */}
      <div className="hyt-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Browse Jobs</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Explore the latest job opportunities and find the right fit for you.</p>
        </div>

        {/* Filter / Search Bar */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#f8fafc',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 0.85rem',
            flex: 1,
            minWidth: '240px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search jobs by title, company or skills..."
              value={browseSearch}
              onChange={(e) => setBrowseSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          <select className="hyt-input" style={{ fontSize: '0.8rem' }}>
            <option>All Locations</option>
            <option>Bengaluru, India</option>
            <option>Remote</option>
          </select>

          <select className="hyt-input" style={{ fontSize: '0.8rem' }}>
            <option>All Types</option>
            <option>Full-time</option>
            <option>Contract</option>
          </select>

          <select className="hyt-input" style={{ fontSize: '0.8rem' }}>
            <option>Any Experience</option>
            <option>1-3 years</option>
            <option>3-5 years</option>
            <option>5+ years</option>
          </select>
        </div>

        {/* Job Cards matching Screenshot 6 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredJobs.map((j) => (
            <div
              key={j.job_id}
              className="hyt-card hyt-card-hover"
              style={{
                padding: '1.125rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: 700
                }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {j.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span>{j.company}</span>
                    <span>•</span>
                    <span>{j.location}</span>
                    <span>•</span>
                    <span>{j.remote_policy === 'remote' ? 'Remote' : 'Full-time'}</span>
                    <span>•</span>
                    <span>{j.min_years_experience}+ years</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.45rem' }}>
                    {j.must_have_skills.slice(0, 5).map(s => (
                      <span key={s} className="hyt-badge badge-neutral" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Posted 2 days ago
                </div>
                <button
                  className="hyt-btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
                  onClick={() => {
                    setSelectedJobForModal(j);
                    setSubmissionFeedback(null);
                  }}
                >
                  Apply →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. My Applications Table matching Screenshot 6 */}
      <div className="hyt-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Applications</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Track the status of your applications and see where you stand.</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="hyt-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Match Score</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{app.company}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{app.appliedOn}</td>
                  <td>
                    <span className={`hyt-badge ${app.statusColor}`}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {app.score}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="hyt-btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Profile & Resume Section matching Screenshot 6 */}
      <div className="hyt-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.25rem' }}>Profile</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Keep your profile updated to get better job recommendations.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              P
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pooja Sharma</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>pooja.sharma@example.com</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <FileText size={16} color="var(--primary)" />
              <span>pooja_sharma_resume.pdf</span>
              <span className="hyt-badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>
            </div>
            <button className="hyt-btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
              Replace Resume
            </button>
          </div>
        </div>
      </div>

      {/* 6. Apply For Job Modal matching Screenshot 20 */}
      {selectedJobForModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }} onClick={() => setSelectedJobForModal(null)}>
          
          <div 
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedJobForModal.title}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {selectedJobForModal.company} • {selectedJobForModal.location} ({selectedJobForModal.remote_policy}) • {selectedJobForModal.min_years_experience}+ years
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobForModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Split Modal Body matching Screenshot 20 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', overflowY: 'auto', flex: 1 }}>
              
              {/* Left Column: Job Description & Requirements */}
              <div style={{ padding: '1.75rem', borderRight: '1px solid var(--border-light)', overflowY: 'auto' }}>
                
                {/* Skills tags */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {selectedJobForModal.must_have_skills.map(s => (
                    <span key={s} className="hyt-badge badge-neutral" style={{ background: '#eef2ff', color: 'var(--primary)', border: '1px solid #c7d2fe' }}>
                      {s}
                    </span>
                  ))}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>Job Description</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedJobForModal.description || 'We are looking for a passionate software engineer to build scalable services and distributed systems.'}
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>Key Responsibilities</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Design, develop, and maintain web applications using modern technologies.</li>
                    <li>Collaborate with cross-functional teams to deliver high quality features.</li>
                    <li>Participate in code reviews and ensure best engineering practices.</li>
                    <li>Troubleshoot and resolve performance bottlenecks in production systems.</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>Requirements (Must Have)</h4>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Bachelor's degree in Computer Science or related technical discipline.</li>
                    <li>{selectedJobForModal.min_years_experience}+ years of verified engineering experience.</li>
                    <li>Demonstrated proficiency in {selectedJobForModal.must_have_skills.join(', ')}.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Apply Form matching Screenshot 20 */}
              <div style={{ padding: '1.75rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {submissionFeedback ? (
                  /* Immediate Live Evaluation Feedback */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--success-bg)',
                      color: 'var(--success-solid)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}>
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success-text)' }}>
                        Application Screened!
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Processed through 12-Gate deterministic pipeline.
                      </p>
                    </div>

                    <div style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-around',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Match Score</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {submissionFeedback.final_score}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status</div>
                        <span className={`hyt-badge ${submissionFeedback.stage === 'Shortlisted' ? 'badge-success' : 'badge-warning'}`}>
                          {submissionFeedback.stage}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'left', background: '#ffffff', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                      <strong>Evidence Citation:</strong> {submissionFeedback.explanation?.strengths_sentence}
                    </p>

                    <button
                      className="hyt-btn btn-primary"
                      onClick={() => setSelectedJobForModal(null)}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  /* Application Form */
                  <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.2rem' }}>Apply for this Job</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Upload your resume and apply to this position.
                      </p>
                    </div>

                    {error && (
                      <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.78rem' }}>
                        {error}
                      </div>
                    )}

                    {/* Drag and drop upload box matching Screenshot 20 */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Upload Resume (PDF or DOCX)
                      </label>
                      <div style={{
                        border: '2px dashed var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}>
                        <UploadCloud size={28} color="var(--primary)" style={{ margin: '0 auto 0.4rem auto' }} />
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Drag and drop your file here, or click to browse
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Max file size: 5 MB
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.txt,.docx"
                          onChange={(e) => setResumeFile(e.target.files ? e.target.files[0] : null)}
                          style={{ display: 'none' }}
                          id="resume-upload-input"
                        />
                        <label htmlFor="resume-upload-input" className="hyt-btn btn-secondary" style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
                          Choose Document
                        </label>
                      </div>

                      {/* Active file indicator matching Screenshot 20 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        marginTop: '0.5rem',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={16} color="var(--primary)" />
                          <span>{resumeFile ? resumeFile.name : 'pooja_sharma_resume.pdf'}</span>
                        </div>
                        <Check size={16} color="var(--success-solid)" />
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Additional Information (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Why do you think you are a good fit for this role?"
                        value={statement}
                        onChange={(e) => setStatement(e.target.value)}
                        className="hyt-input"
                        style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="hyt-btn btn-primary"
                      disabled={submitting}
                      style={{ width: '100%', padding: '0.65rem', fontSize: '0.875rem' }}
                    >
                      {submitting ? 'Screening Candidate...' : 'Submit Application →'}
                    </button>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Your application will be verified and sent to {selectedJobForModal.company}.
                    </div>
                  </form>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
