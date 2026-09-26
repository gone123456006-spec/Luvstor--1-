import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import promoAppIcon from '../assets/promo-app-icon.png';
import '../legalPages.css';

const LegalLayout = ({ title, updated, children }) => {
  useEffect(() => {
    document.title = title;

    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      htmlPos: html.style.position,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyPos: body.style.position,
      rootOverflow: root?.style.overflow || '',
      rootHeight: root?.style.height || '',
      rootPos: root?.style.position || '',
    };

    html.style.overflow = 'auto';
    html.style.height = 'auto';
    html.style.position = 'static';
    body.style.overflow = 'auto';
    body.style.height = 'auto';
    body.style.minHeight = '100%';
    body.style.position = 'static';
    body.classList.remove('chat-scroll-lock');
    if (root) {
      root.style.overflow = 'visible';
      root.style.height = 'auto';
      root.style.minHeight = '100%';
      root.style.position = 'static';
    }
    html.classList.add('legal-page-active');
    body.classList.add('legal-page-active');

    return () => {
      document.title = 'Luvstor';
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      html.style.position = prev.htmlPos;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      body.style.position = prev.bodyPos;
      body.style.minHeight = '';
      if (root) {
        root.style.overflow = prev.rootOverflow;
        root.style.height = prev.rootHeight;
        root.style.position = prev.rootPos;
        root.style.minHeight = '';
      }
      html.classList.remove('legal-page-active');
      body.classList.remove('legal-page-active');
    };
  }, [title]);

  return (
    <div className="legal-page">
      <div className="legal-top">
        <Link to="/promo" className="legal-brand">
          <img src={promoAppIcon} alt="" />
          Luvstor
        </Link>
        <Link to="/promo" className="legal-back">
          ← Back to Luvstor
        </Link>
      </div>

      <main className="legal-wrap">
        <h1>{title.replace(' | Luvstor', '')}</h1>
        {updated ? <p className="legal-updated">Last updated: {updated}</p> : null}
        {children}
      </main>

      <footer className="legal-footer">
        <p>© {new Date().getFullYear()} Luvstor</p>
        <div className="legal-footer-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/delete-account">Account Deletion</Link>
          <Link to="/data-safety">Data Safety</Link>
          <Link to="/child-safety">Child Safety</Link>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;
