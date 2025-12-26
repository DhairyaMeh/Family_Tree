import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const pricingTiers = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'View trees shared with you',
    features: [
      'View shared family trees',
      'Basic navigation',
      'Mobile friendly',
    ],
    limitations: [
      'Cannot create trees',
      'Cannot edit trees',
    ],
    color: '#64748b',
    popular: false,
  },
  {
    name: 'Silver',
    price: '₹299',
    period: '/month',
    description: 'Perfect for individuals',
    features: [
      'Create 1 family tree',
      'Add unlimited members',
      'Edit & delete members',
      'Share via link',
      'Export options',
    ],
    limitations: [],
    color: '#94a3b8',
    popular: false,
  },
  {
    name: 'Gold',
    price: '₹999',
    period: '/month',
    description: 'For large families',
    features: [
      'Create up to 5 family trees',
      'All Silver features',
      'Priority support',
      'Advanced sharing options',
      'Collaboration features',
    ],
    limitations: [],
    color: '#f59e0b',
    popular: true,
  },
];

const features = [
  {
    icon: '🌳',
    title: 'Visual Family Trees',
    description: 'Beautiful, interactive tree visualization with smooth animations and intuitive navigation.',
  },
  {
    icon: '👨‍👩‍👧‍👦',
    title: 'Complete Relationships',
    description: 'Track spouses, children, parents, and extended family members with ease.',
  },
  {
    icon: '📱',
    title: 'Works Everywhere',
    description: 'Access your family tree from any device - desktop, tablet, or mobile.',
  },
  {
    icon: '🔗',
    title: 'Easy Sharing',
    description: 'Share your family tree with relatives via a simple link.',
  },
  {
    icon: '🖼️',
    title: 'Photo Support',
    description: 'Add photos to family members to bring your tree to life.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description: 'Your family data is private and secure. Only share what you want.',
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="home-nav">
        <Link to="/" className="nav-brand">
          <span>🌳</span> Family Tree
        </Link>
        <div className="nav-links">
          <a href="#about" className="nav-link">About</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          {user ? (
            <Link to="/tree" className="nav-link">{user.username}</Link>
          ) : (
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>
            Build Your Family's
            <span className="gradient-text"> Legacy</span>
          </h1>
          <p>
            Create beautiful, interactive family trees. Connect generations,
            preserve memories, and share your heritage with loved ones.
          </p>
          <div className="hero-actions">
            <Link to={user ? '/tree' : '/signup'} className="btn-primary btn-large">
              {user ? 'Go to My Trees' : 'Start Free'}
            </Link>
            <a href="#about" className="btn-secondary btn-large">
              Learn More
            </a>
          </div>
        </motion.div>
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="tree-preview">
            <div className="preview-node grandparent">👴 👵</div>
            <div className="preview-line"></div>
            <div className="preview-node parent">👨 👩</div>
            <div className="preview-line"></div>
            <div className="preview-children">
              <div className="preview-node child">👦</div>
              <div className="preview-node child">👧</div>
              <div className="preview-node child">👶</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-header">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Everything You Need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Powerful features to document and share your family history
          </motion.p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Simple Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Choose the plan that works for you
          </motion.p>
        </div>
        <div className="pricing-cards">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              className={`pricing-card ${tier.popular ? 'popular' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              <div className="card-header" style={{ borderColor: tier.color }}>
                <h3>{tier.name}</h3>
                <div className="price">
                  <span className="amount">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
                <p>{tier.description}</p>
              </div>
              <div className="card-body">
                <ul className="features-list">
                  {tier.features.map((feature, i) => (
                    <li key={i}>
                      <span className="check">✓</span>
                      {feature}
                    </li>
                  ))}
                  {tier.limitations.map((limitation, i) => (
                    <li key={`lim-${i}`} className="limitation">
                      <span className="cross">✗</span>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-footer">
                <Link
                  to={user ? '/tree' : '/signup'}
                  className="select-btn"
                  style={{
                    background: tier.popular
                      ? `linear-gradient(135deg, ${tier.color}, #f59e0b)`
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {user ? 'Current Plan' : 'Get Started'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>🌳</span> Family Tree
          </div>
          <p>© 2024 Family Tree. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        .home-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          color: #f1f5f9;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .home-nav {
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
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #f1f5f9;
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
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .btn-secondary {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-large {
          padding: 14px 28px;
          font-size: 16px;
        }

        /* Hero */
        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 60px;
          gap: 60px;
        }

        .hero-content {
          flex: 1;
        }

        .hero h1 {
          font-size: 56px;
          line-height: 1.1;
          margin: 0 0 24px;
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero p {
          font-size: 20px;
          color: #94a3b8;
          line-height: 1.6;
          margin: 0 0 32px;
          max-width: 500px;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
        }

        .hero-visual {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .tree-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .preview-node {
          background: linear-gradient(135deg, #1e293b, #334155);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px 24px;
          font-size: 32px;
        }

        .preview-line {
          width: 2px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
        }

        .preview-children {
          display: flex;
          gap: 16px;
        }

        /* About Section */
        .about-section {
          padding: 100px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-header h2 {
          font-size: 40px;
          margin: 0 0 16px;
        }

        .section-header p {
          font-size: 18px;
          color: #94a3b8;
          margin: 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
          transition: transform 0.2s, border-color 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .feature-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-size: 20px;
          margin: 0 0 12px;
        }

        .feature-card p {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        /* Pricing Section */
        .pricing-section {
          padding: 100px 60px;
          background: rgba(0, 0, 0, 0.2);
        }

        .pricing-cards {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
          max-width: 1100px;
          margin: 0 auto;
        }

        .pricing-card {
          background: #1e293b;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 320px;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .pricing-card.popular {
          border-color: #f59e0b;
          transform: scale(1.05);
        }

        .popular-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .card-header {
          padding: 32px 24px;
          border-bottom: 2px solid;
          text-align: center;
        }

        .card-header h3 {
          font-size: 24px;
          margin: 0 0 16px;
        }

        .price {
          margin-bottom: 12px;
        }

        .price .amount {
          font-size: 48px;
          font-weight: 700;
        }

        .price .period {
          font-size: 16px;
          color: #94a3b8;
        }

        .card-header p {
          color: #94a3b8;
          margin: 0;
          font-size: 14px;
        }

        .card-body {
          padding: 24px;
          flex: 1;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          font-size: 14px;
        }

        .features-list .check {
          color: #4ade80;
          font-weight: bold;
        }

        .features-list .cross {
          color: #64748b;
        }

        .features-list .limitation {
          color: #64748b;
        }

        .card-footer {
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .select-btn {
          display: block;
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .select-btn:hover {
          transform: translateY(-2px);
        }

        /* Footer */
        .home-footer {
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

        .footer-content p {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .hero {
            flex-direction: column;
            text-align: center;
            padding: 60px 20px;
          }

          .hero p {
            max-width: 100%;
          }

          .hero-actions {
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .home-nav {
            padding: 16px 20px;
          }

          .nav-links {
            gap: 16px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .hero p {
            font-size: 16px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card {
            width: 100%;
          }

          .pricing-card.popular {
            transform: none;
          }

          .footer-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

