import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout from '../components/LegalLayout';

const PrivacyPolicy = () => (
  <LegalLayout title="Privacy Policy | Luvstor" updated="September 22, 2026">
    <p>
      Luvstor (“we”, “our”, or “us”) helps adults aged 18 and over meet nearby
      people, chat, and connect. This Privacy Policy explains what information
      we collect, how we use it, and the choices you have. By using Luvstor, you
      agree to this policy.
    </p>

    <section>
      <h2>1. Who can use Luvstor</h2>
      <p>
        Luvstor is only for users aged 18 and older. We do not knowingly collect
        personal information from anyone under 18. If you believe a minor has
        created an account, contact us and we will take action.
      </p>
    </section>

    <section>
      <h2>2. Information you provide</h2>
      <ul>
        <li>Account details such as email address and login verification codes</li>
        <li>
          Profile details such as name, age, gender, bio, interests, photos,
          cover photo, and other information you choose to add
        </li>
        <li>Messages you send, including text, photos, and voice notes</li>
        <li>Optional Google sign-in details if you choose that login method</li>
        <li>Support messages and feedback you send us</li>
        <li>
          Payment-related details when you buy Premium or tokens (processed by
          our payment partner; we do not store full card numbers)
        </li>
      </ul>
    </section>

    <section>
      <h2>3. Information collected automatically</h2>
      <ul>
        <li>
          Approximate or precise location, only with your permission, to show
          people nearby
        </li>
        <li>
          Device information such as device type, operating system, and a device
          identifier used to keep your session secure
        </li>
        <li>
          A push notification token so we can alert you about messages, calls,
          and important updates
        </li>
        <li>
          Basic usage and connection information needed to run chat, calls, and
          discovery reliably
        </li>
      </ul>
    </section>

    <section>
      <h2>4. How we use your information</h2>
      <ul>
        <li>Create and manage your account</li>
        <li>Show nearby people and discovery based on your preferences</li>
        <li>Deliver chat, voice notes, voice calls, and video calls</li>
        <li>
          Send notifications about messages, calls, likes, and account activity
        </li>
        <li>Process Premium and token purchases</li>
        <li>
          Help keep the community safer by preventing fraud, abuse, and spam
        </li>
        <li>Improve app quality and fix problems</li>
        <li>Communicate about account, security, and service updates</li>
      </ul>
    </section>

    <section>
      <h2>5. Location</h2>
      <p>
        With your permission, Luvstor uses your location to show nearby people
        and distances. You can turn location off in your device settings.
        Without location, nearby discovery may be limited or unavailable.
      </p>
    </section>

    <section>
      <h2>6. Photos, voice notes, and media</h2>
      <p>
        Profile photos, cover photos, gallery images, chat images, and voice
        notes are stored on our servers so they can be shown to you and to
        people you share them with. Content you send in chat can be seen by
        people in that conversation. Please only share what you are comfortable
        sharing.
      </p>
    </section>

    <section>
      <h2>7. Voice and video calls</h2>
      <p>
        Calls use your microphone and, for video, your camera. We do not record
        or store the live call audio or video content. We may keep limited call
        details such as who called whom, call type, and timing so the service
        can work and be supported.
      </p>
    </section>

    <section>
      <h2>8. Notifications</h2>
      <p>
        If you allow notifications, we may send alerts for new messages,
        incoming calls, likes, matches, and important account notices. You can
        change notification permission in your device settings.
      </p>
    </section>

    <section>
      <h2>9. How we share information</h2>
      <p>We do not sell your personal information. We may share information:</p>
      <ul>
        <li>
          With other users as part of normal use, such as your profile, photos
          you publish, and messages you send them
        </li>
        <li>
          With trusted service providers who help us run the app, such as
          hosting, email delivery, push delivery, and payments
        </li>
        <li>
          When required by law, or to protect users, rights, and safety
        </li>
        <li>With your consent for a specific purpose</li>
      </ul>
    </section>

    <section>
      <h2>10. Data security</h2>
      <p>
        We use reasonable technical and organizational measures to protect your
        information. No online service is completely secure. Please protect your
        login email and device.
      </p>
    </section>

    <section>
      <h2>11. How long we keep data</h2>
      <p>
        We keep your information while your account is active and as needed to
        provide the service. If you delete your account, we follow our{' '}
        <Link to="/delete-account">Account Deletion Policy</Link>, including a
        short grace period, then permanent removal of personal account data,
        subject to limited legal or safety retention.
      </p>
    </section>

    <section>
      <h2>12. Your choices and rights</h2>
      <ul>
        <li>Update your profile and photos in the app</li>
        <li>
          Control location, camera, microphone, and notification permissions on
          your device
        </li>
        <li>Block users and manage privacy settings</li>
        <li>Delete your account from Settings → Account → Delete account</li>
        <li>Contact us to ask questions about your data</li>
      </ul>
    </section>

    <section>
      <h2>13. Children’s privacy</h2>
      <p>
        Luvstor is not directed to children. Users must be 18 or older.
      </p>
    </section>

    <section>
      <h2>14. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the
        updated version on this page and change the “Last updated” date.
        Important changes may also be communicated in the app or by email.
      </p>
    </section>

    <section>
      <h2>15. Contact us</h2>
      <p>
        Questions about privacy or your data:
        <br />
        Email:{' '}
        <a href="mailto:luvstorapps@gmail.com">luvstorapps@gmail.com</a>
        <br />
        In-app: Settings → Help &amp; Support
      </p>
    </section>
  </LegalLayout>
);

export default PrivacyPolicy;
