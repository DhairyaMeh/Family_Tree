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

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="pricing-page">
      <nav className="pricing-nav">
        <Link to="/" className="nav-brand">
          <span>🌳</span> Family Tree
        </Link>
        <div className="nav-links">
          {user ? (
            <Link to="/tree" className="btn-primary">Go to App</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      <section className="pricing-hero">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Choose the plan that's right for your family
        </motion.p>
      </section>

      <section className="pricing-cards">
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            className={`pricing-card ${tier.popular ? 'popular' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
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
              <ul className="features">
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
              {user && user.tier?.toLowerCase() === tier.name.toLowerCase() ? (
                <div 
                  className="select-btn current-plan"
                  style={{ 
                    background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)`,
                    cursor: 'default'
                  }}
                >
                  ✓ Current Plan
                </div>
              ) : tier.name === 'Free' && user && (user.tier === 'silver' || user.tier === 'gold' || user.tier === 'admin') ? (
                <div 
                  className="select-btn included"
                  style={{ 
                    background: 'rgba(74, 222, 128, 0.2)',
                    cursor: 'default',
                    border: '1px solid rgba(74, 222, 128, 0.3)'
                  }}
                >
                  ✓ Included
                </div>
              ) : (
                <Link 
                  to={user ? '/tree' : '/signup'} 
                  className="select-btn"
                  style={{ 
                    background: tier.popular 
                      ? `linear-gradient(135deg, ${tier.color}, #f59e0b)` 
                      : 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {user ? 'Upgrade' : 'Get Started'}
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </section>

      <section className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Can I upgrade or downgrade anytime?</h4>
            <p>Yes! You can change your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>The Free tier lets you explore shared trees. Upgrade when you're ready to create your own.</p>
          </div>
          <div className="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>We accept all major credit cards, UPI, and net banking.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>Absolutely! Cancel anytime with no questions asked. Your trees remain accessible in view-only mode.</p>
          </div>
        </div>
      </section>

      <style>{`
        .pricing-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .pricing-nav {
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
          gap: 12px;
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

        .btn-primary {
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 8px;
          color: white;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: transform 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
        }

        .pricing-hero {
          text-align: center;
          padding: 60px 20px;
        }

        .pricing-hero h1 {
          font-size: 48px;
          margin: 0 0 16px;
          background: linear-gradient(135deg, #f1f5f9, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-hero p {
          font-size: 20px;
          color: #94a3b8;
          margin: 0;
        }

        .pricing-cards {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding: 20px 40px 60px;
          flex-wrap: wrap;
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

        .features {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          font-size: 14px;
        }

        .features .check {
          color: #4ade80;
          font-weight: bold;
        }

        .features .cross {
          color: #64748b;
        }

        .features .limitation {
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

        .select-btn.current-plan,
        .select-btn.included {
          opacity: 1;
        }

        .select-btn.current-plan:hover,
        .select-btn.included:hover {
          transform: none;
        }

        .select-btn.included {
          color: #4ade80;
        }

        .pricing-faq {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 40px;
        }

        .pricing-faq h2 {
          text-align: center;
          font-size: 32px;
          margin: 0 0 40px;
        }

        .faq-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .faq-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
        }

        .faq-item h4 {
          margin: 0 0 12px;
          font-size: 16px;
        }

        .faq-item p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .pricing-nav {
            padding: 20px;
          }

          .pricing-hero h1 {
            font-size: 32px;
          }

          .pricing-cards {
            padding: 20px;
          }

          .pricing-card {
            width: 100%;
          }

          .pricing-card.popular {
            transform: none;
          }

          .faq-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

