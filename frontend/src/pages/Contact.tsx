import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="contact-page">
      {/* Navigation */}
      <nav className="contact-nav">
        <Link to="/" className="nav-brand">
          <span>🌳</span> Family Tree
        </Link>
        <div className="nav-center">
          <Link to="/#about" className="nav-link">About</Link>
          <Link to="/#pricing" className="nav-link">Pricing</Link>
          <Link to="/#faq" className="nav-link">FAQ</Link>
          <Link to="/contact" className="nav-link active">Contact</Link>
        </div>
        <div className="nav-user">
          {user ? (
            <Link to="/tree" className="user-btn">
              <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.username}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="contact-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Get in Touch</h1>
          <p>Have questions or feedback? We'd love to hear from you.</p>
        </motion.div>
      </section>

      {/* Contact Content */}
      <section className="contact-content">
        <div className="contact-grid">
          {/* Contact Form */}
          <motion.div
            className="contact-form-wrapper"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {submitted ? (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We'll get back to you within 24-48 hours.</p>
                <button 
                  className="btn-primary"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2>Send us a Message</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Report a Bug</option>
                    <option value="partnership">Partnership Opportunity</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            className="contact-info"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="info-card">
              <div className="info-icon">📧</div>
              <h3>Email Us</h3>
              <p>support@familytree.app</p>
              <p className="info-note">We typically respond within 24 hours</p>
            </div>

            <div className="info-card">
              <div className="info-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Available Mon-Fri, 9AM-6PM IST</p>
              <p className="info-note">Gold tier members get priority support</p>
            </div>

            <div className="info-card">
              <div className="info-icon">📍</div>
              <h3>Office</h3>
              <p>Mumbai, India</p>
              <p className="info-note">By appointment only</p>
            </div>

            <div className="social-links">
              <h3>Follow Us</h3>
              <div className="social-icons">
                <a href="#" className="social-icon" aria-label="Twitter">𝕏</a>
                <a href="#" className="social-icon" aria-label="LinkedIn">in</a>
                <a href="#" className="social-icon" aria-label="Instagram">📷</a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="faq-cta-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Looking for Quick Answers?</h2>
          <p>Check out our frequently asked questions for instant help.</p>
          <Link to="/#faq" className="btn-secondary">View FAQ</Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="contact-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>🌳</span> Family Tree
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/#faq">FAQ</Link>
          </div>
          <p>© 2024 Family Tree. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .contact-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          color: #f1f5f9;
          overflow-y: auto;
        }

        .contact-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 60px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
          text-decoration: none;
          color: #f1f5f9;
          flex: 1;
        }

        .nav-center {
          display: flex;
          align-items: center;
          gap: 32px;
          flex: 2;
          justify-content: center;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          justify-content: flex-end;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
          padding: 8px 0;
          position: relative;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #f1f5f9;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          transition: width 0.3s;
        }

        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }

        .user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 30px;
          text-decoration: none;
          color: #f1f5f9;
          transition: all 0.2s;
        }

        .user-btn:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3));
          transform: translateY(-2px);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
        }

        .btn-primary {
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          padding: 12px 24px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-block;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Hero */
        .contact-hero {
          text-align: center;
          padding: 80px 60px 40px;
        }

        .contact-hero h1 {
          font-size: 48px;
          margin: 0 0 16px;
          background: linear-gradient(135deg, #f1f5f9, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .contact-hero p {
          font-size: 18px;
          color: #94a3b8;
          margin: 0;
        }

        /* Contact Content */
        .contact-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 60px 80px;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 48px;
          align-items: start;
        }

        /* Form */
        .contact-form-wrapper {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px;
        }

        .contact-form-wrapper h2 {
          margin: 0 0 32px;
          font-size: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: #94a3b8;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #f1f5f9;
          font-size: 14px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-group select {
          cursor: pointer;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Success Message */
        .success-message {
          text-align: center;
          padding: 40px 20px;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: white;
          margin: 0 auto 24px;
        }

        .success-message h3 {
          font-size: 24px;
          margin: 0 0 12px;
        }

        .success-message p {
          color: #94a3b8;
          margin: 0 0 24px;
        }

        /* Contact Info */
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s;
        }

        .info-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
        }

        .info-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .info-card h3 {
          font-size: 16px;
          margin: 0 0 8px;
        }

        .info-card p {
          margin: 0;
          font-size: 14px;
          color: #f1f5f9;
        }

        .info-note {
          color: #64748b !important;
          font-size: 12px !important;
          margin-top: 4px !important;
        }

        .social-links {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
        }

        .social-links h3 {
          font-size: 16px;
          margin: 0 0 16px;
        }

        .social-icons {
          display: flex;
          gap: 12px;
        }

        .social-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: #f1f5f9;
          font-size: 18px;
          transition: all 0.2s;
        }

        .social-icon:hover {
          background: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }

        /* FAQ CTA */
        .faq-cta-section {
          text-align: center;
          padding: 60px;
          background: rgba(59, 130, 246, 0.1);
          border-top: 1px solid rgba(59, 130, 246, 0.2);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }

        .faq-cta-section h2 {
          font-size: 28px;
          margin: 0 0 12px;
        }

        .faq-cta-section p {
          color: #94a3b8;
          margin: 0 0 24px;
        }

        /* Footer */
        .contact-footer {
          padding: 40px 60px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
        }

        .footer-links {
          display: flex;
          gap: 24px;
        }

        .footer-links a {
          color: #64748b;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #f1f5f9;
        }

        .footer-content p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .contact-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .contact-nav {
            padding: 16px 20px;
            flex-wrap: wrap;
            gap: 16px;
          }

          .nav-brand {
            flex: unset;
          }

          .nav-center {
            order: 3;
            flex: 0 0 100%;
            justify-content: center;
            gap: 16px;
          }

          .nav-user {
            flex: unset;
          }

          .contact-hero {
            padding: 60px 20px 30px;
          }

          .contact-hero h1 {
            font-size: 32px;
          }

          .contact-content {
            padding: 20px;
          }

          .contact-form-wrapper {
            padding: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .footer-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .footer-links {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

