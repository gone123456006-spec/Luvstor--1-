import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Monitor, Star } from 'lucide-react';
import promoAppIcon from '../assets/promo-app-icon.png';
import promoOnboarding from '../assets/promo-onboarding.png';
import promoDiscover from '../assets/promo-discover.png';
import '../promoLanding.css';

const BANNER_SLIDES = [
  {
    title: 'Video & Voice Call With Friends',
    body: 'Switch from chat to a call in one tap. Stay anonymous until you decide otherwise.',
  },
  {
    title: 'Meet People Nearby Every Day',
    body: 'Discover new faces around you and start conversations that feel natural.',
  },
  {
    title: 'Chat Freely Your Way',
    body: 'Send text, photos, and voice notes—then upgrade to a call when it feels right.',
  },
  {
    title: 'Stay Private Stay Safe',
    body: 'Built for adults 18+. Control privacy, block anytime, and connect on your terms.',
  },
];

/** Independent promotional page — /promo */
const PromoLanding = () => {
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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
    html.classList.add('promo-landing-active');
    body.classList.add('promo-landing-active');

    return () => {
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
      html.classList.remove('promo-landing-active');
      body.classList.remove('promo-landing-active');
    };
  }, []);

  const handleInstall = () => {
    window.open('https://play.google.com/store', '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Luvstor',
          text: 'Chat, call & connect on Luvstor',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (_) { }
  };

  return (
    <div className="promo-page">
      <header className="promo-store">
        <div className="promo-store-inner">
          <div className="promo-store-left">
            <h1 className="promo-store-title">Luvstor : Chat, Call, Video, Connect</h1>
            <p className="promo-store-brand">Luvstor</p>
            <p className="promo-store-meta">In-app purchases</p>

            <div className="promo-store-actions">
              <button type="button" className="promo-install-btn" onClick={handleInstall}>
                Install
              </button>
              <button type="button" className="promo-ghost-btn" onClick={handleShare}>
                <Share2 size={26} strokeWidth={2} />
                Share
              </button>
            </div>

            <p className="promo-device-note">
              <Monitor size={24} strokeWidth={2} />
              This app is available for your device
            </p>
          </div>

          <div className="promo-store-right">
            <div className="promo-hero-phones">
              <img
                src={promoOnboarding}
                alt="Luvstor onboarding"
                className="promo-real-img tilt-left"
              />
              <img
                src={promoDiscover}
                alt="Luvstor Discover"
                className="promo-real-img tilt-main framed"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="promo-block promo-about">
        <div className="promo-wrap">
          <h2 className="promo-h2">About this app</h2>
          <div className="promo-about-grid">
            <div className="promo-about-left">
              <p className="promo-lead">
                Luvstor helps adults 18+ meet people nearby and turn a hello into
                something real. Create your profile, discover who’s around you, and
                start chatting with text, photos, and voice notes. When it feels
                right, hop on a voice or video call—without leaving the app. Keep up
                with matches, explore new faces, and stay in control with clear
                privacy tools. Want more? Premium unlocks extra reach and features.
                Meet nearby. Chat freely. Start something real.
              </p>
            </div>
            <div className="promo-about-right">
              <ul className="promo-about-features">
                <li>Meet &amp; discover people nearby</li>
                <li>Profile with photos, bio &amp; gallery</li>
                <li>Chat with text, photos &amp; voice notes</li>
                <li>Voice &amp; video calls in-app</li>
                <li>Stay connected with mutual likes</li>
                <li>Verified badge &amp; invite friends</li>
                <li>Premium for more visibility</li>
                <li>Privacy controls, block anytime</li>
                <li>Safe space for adults 18+</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="promo-banner">
        <div className="promo-banner-inner">
          <div
            className={`promo-banner-copy promo-banner-anim-${bannerIndex}`}
            key={bannerIndex}
          >
            <h2>{BANNER_SLIDES[bannerIndex].title}</h2>
            <p>{BANNER_SLIDES[bannerIndex].body}</p>
          </div>
        </div>
      </section>

      <section className="promo-block promo-block-muted">
        <div className="promo-wrap promo-safety">
          <div>
            <h2 className="promo-h2">Data safety</h2>
            <p className="promo-muted">
              Luvstor collects only what is needed to run the service: account
              and profile details, messages and media you share, location with
              your permission, device info for security, and purchase details for
              Premium or tokens. We do not sell your personal information. Live
              voice and video call content is not recorded or stored.
            </p>
          </div>
          <dl className="promo-dl">
            <div>
              <dt>No sale of data</dt>
              <dd>We do not sell your personal information</dd>
            </div>
            <div>
              <dt>Calls not recorded</dt>
              <dd>Live voice &amp; video content is not stored</dd>
            </div>
            <div>
              <dt>Delete anytime</dt>
              <dd>Hidden immediately, removed after 7 days</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="promo-block promo-policies">
        <div className="promo-wrap">
          <h2 className="promo-h2">Privacy &amp; policies</h2>
          <p className="promo-muted promo-policies-lead">
            Read how we handle your data, keep the community safe, and how you
            can delete your account.
          </p>
          <div className="promo-policy-cards">
            <Link to="/privacy" className="promo-policy-card">
              <img src={promoAppIcon} alt="" />
              <div>
                <strong>Privacy Policy</strong>
                <span>What we collect and how we use it</span>
              </div>
            </Link>
            <Link to="/delete-account" className="promo-policy-card">
              <img src={promoAppIcon} alt="" />
              <div>
                <strong>Account Deletion</strong>
                <span>How to delete your account and data</span>
              </div>
            </Link>
            <Link to="/data-safety" className="promo-policy-card">
              <img src={promoAppIcon} alt="" />
              <div>
                <strong>Data Safety</strong>
                <span>Short summary of our data practices</span>
              </div>
            </Link>
            <Link to="/child-safety" className="promo-policy-card">
              <img src={promoAppIcon} alt="" />
              <div>
                <strong>Child Safety</strong>
                <span>Our child safety standards and reporting process</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="promo-block">
        <div className="promo-wrap">
          <h2 className="promo-h2">Ratings and reviews</h2>
          <div className="promo-rating-row">
            <div className="promo-rating-big">
              <span>4.5</span>
              <div className="promo-stars" aria-hidden="true">
                <Star size={14} fill="#ffd369" color="#ffd369" />
                <Star size={14} fill="#ffd369" color="#ffd369" />
                <Star size={14} fill="#ffd369" color="#ffd369" />
                <Star size={14} fill="#ffd369" color="#ffd369" />
                <Star size={14} fill="rgba(255,255,255,0.25)" color="rgba(255,255,255,0.25)" />
              </div>
              <p>5.9L reviews</p>
            </div>
            <div className="promo-review-list">
              <article>
                <header>
                  <strong>Aarav</strong>
                  <span>4.5★</span>
                </header>
                <p>Matching is fast and the UI feels clean. Good for quick chats.</p>
              </article>
              <article>
                <header>
                  <strong>Meera</strong>
                  <span>5★</span>
                </header>
                <p>Voice quality is solid. Prefer the anonymous start over other apps.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <footer className="promo-footer">
        <p>© {new Date().getFullYear()} Luvstor</p>
        <div className="promo-footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/delete-account">Delete account</Link>
          <Link to="/data-safety">Data safety</Link>
          <Link to="/child-safety">Child safety</Link>
        </div>
      </footer>
    </div>
  );
};

export default PromoLanding;
