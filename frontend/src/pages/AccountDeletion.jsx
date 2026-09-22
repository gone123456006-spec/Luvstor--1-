import React from 'react';
import LegalLayout from '../components/LegalLayout';

const AccountDeletion = () => (
  <LegalLayout
    title="Account Deletion Policy | Luvstor"
    updated="September 22, 2026"
  >
    <p>
      You can deactivate and permanently delete your Luvstor account at any
      time. You stay in control of your data.
    </p>

    <section>
      <h2>How to delete in the app</h2>
      <ul>
        <li>Open Luvstor</li>
        <li>Go to Settings → Account</li>
        <li>Tap Delete account</li>
        <li>
          Confirm that you understand deletion is permanent after the grace
          period
        </li>
        <li>Choose a reason (optional)</li>
        <li>Complete the final confirmation</li>
      </ul>
    </section>

    <section>
      <h2>What happens right away</h2>
      <p>When you confirm deletion:</p>
      <ul>
        <li>Your account is deactivated</li>
        <li>Your profile is hidden from other users</li>
        <li>You stop appearing in Nearby, search, and discovery</li>
        <li>You are logged out</li>
        <li>Permanent deletion is scheduled for 7 days later</li>
      </ul>
    </section>

    <section>
      <h2>7-day grace period</h2>
      <p>You have 7 days to change your mind. During this time:</p>
      <ul>
        <li>Your account stays hidden from others</li>
        <li>You can restore your account by logging in again</li>
        <li>We may send a reminder before permanent deletion</li>
      </ul>
      <p>
        After 7 days, deletion becomes permanent and cannot be undone.
      </p>
    </section>

    <section>
      <h2>What is permanently removed</h2>
      <p>
        After the grace period ends, we permanently remove account data
        including:
      </p>
      <ul>
        <li>Profile information such as name, bio, and preferences</li>
        <li>Photos, cover photo, and gallery media tied to your account</li>
        <li>Matches, likes, and friendship data</li>
        <li>
          Chats, text messages, images, and voice notes associated with your
          account
        </li>
        <li>Location and discovery history for your account</li>
        <li>Device push tokens for your account</li>
        <li>In-app notifications for your account</li>
      </ul>
    </section>

    <section>
      <h2>What may be kept briefly or separately</h2>
      <p>
        For legal, safety, accounting, or abuse-prevention reasons, we may
        retain limited information such as:
      </p>
      <ul>
        <li>
          Payment or transaction records required for accounting or tax rules
        </li>
        <li>
          Information needed for fraud, safety, or legal investigations
        </li>
        <li>
          Anonymized or aggregated data that no longer identifies you
        </li>
      </ul>
    </section>

    <section>
      <h2>Premium and purchases</h2>
      <p>If you have Premium or token purchases:</p>
      <ul>
        <li>
          Benefits tied to your Luvstor account end when the account is deleted
        </li>
        <li>Refunds follow our subscription and refund terms</li>
        <li>
          If you bought through a store such as Google Play, you may also need
          to manage that purchase in the store’s subscription settings
        </li>
      </ul>
    </section>

    <section>
      <h2>Before you delete</h2>
      <ul>
        <li>Block specific people instead of leaving</li>
        <li>Adjust who can find or message you</li>
        <li>
          Contact Help &amp; Support if you are facing a problem we can fix
        </li>
      </ul>
    </section>

    <section>
      <h2>Request deletion by email</h2>
      <p>
        If you cannot delete from the app, email{' '}
        <a href="mailto:luvstorapps@gmail.com">luvstorapps@gmail.com</a> from the
        address linked to your account. We aim to process verified requests
        within 7 business days.
      </p>
    </section>

    <section>
      <h2>After permanent deletion</h2>
      <p>
        You may create a new account later with the same or a different email. A
        new account does not restore old matches, chats, or media.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        Email:{' '}
        <a href="mailto:luvstorapps@gmail.com">luvstorapps@gmail.com</a>
        <br />
        In-app: Settings → Help &amp; Support
      </p>
    </section>
  </LegalLayout>
);

export default AccountDeletion;
