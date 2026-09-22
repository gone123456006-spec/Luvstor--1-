import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout';

const DataSafety = () => (
  <LegalLayout title="Data Safety | Luvstor">
    <p>
      Luvstor collects only the information needed to run the service: account
      and profile details, messages and media you share, location with your
      permission for nearby discovery, device information for security, and
      purchase details for Premium or tokens.
    </p>
    <p>
      We use this information to provide matching, chat, calls, notifications,
      and account services. We do not sell your personal information.
    </p>
    <p>
      Live voice and video call content is not recorded or stored. Chat content
      and profile media are stored so the service can work.
    </p>
    <p>
      You can control permissions on your device and delete your account from
      the app. Account deletion hides your profile immediately and permanently
      removes personal account data after a 7-day grace period, unless you log
      in again to restore the account.
    </p>
    <p>
      For full details, read our{' '}
      <Link to="/privacy">Privacy Policy</Link> and{' '}
      <Link to="/delete-account">Account Deletion Policy</Link>.
    </p>
    <p>
      Contact:{' '}
      <a href="mailto:luvstorapps@gmail.com">luvstorapps@gmail.com</a>
    </p>
  </LegalLayout>
);

export default DataSafety;
