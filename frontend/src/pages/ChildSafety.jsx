import React from 'react';
import LegalLayout from '../components/LegalLayout';

const ChildSafety = () => (
  <LegalLayout title="Child Safety Standards | Luvstor" updated="September 26, 2026">
    <p>
      Luvstor is a social and dating service for adults. These standards apply
      to every account, profile, message, image, voice note, call, and other
      activity on Luvstor. Protecting children from sexual abuse and exploitation
      is a strict requirement for using the service.
    </p>

    <section>
      <h2>Adults only</h2>
      <p>
        You must be at least 18 years old to create or use a Luvstor account. Do
        not create an account for a child, pretend to be an adult when you are
        under 18, or use Luvstor to contact or target a child.
      </p>
      <p>
        If we learn that an account belongs to someone under 18, we may restrict
        or close it. We may also take action against accounts that try to obtain,
        share, or solicit sexual content involving a child.
      </p>
    </section>

    <section>
      <h2>Prohibited conduct</h2>
      <p>
        Luvstor does not allow anyone to use the service to sexually abuse,
        exploit, endanger, or target a child. Prohibited conduct includes:
      </p>
      <ul>
        <li>
          Creating, requesting, possessing, uploading, sharing, or distributing
          child sexual abuse material (CSAM), including sexualized depictions of
          a child.
        </li>
        <li>Grooming, sexual solicitation, or attempts to arrange sexual contact with a child.</li>
        <li>
          Sextortion, blackmail, trafficking, or exchanging money or benefits
          for access to a child.
        </li>
        <li>Encouraging, arranging, or helping another person carry out any of these acts.</li>
      </ul>
      <p>
        Claims that content is fictional, consensual, or shared privately do not
        make child sexual exploitation acceptable.
      </p>
    </section>

    <section>
      <h2>Report a concern</h2>
      <p>
        Use the report control on a profile in Luvstor and choose{' '}
        <strong>Underage user</strong> if you believe the account holder is under
        18. Choose <strong>Inappropriate content</strong> for suspected
        exploitative material or behavior, and include relevant details. You may
        also email our child safety contact at{' '}
        <a href="mailto:luvstorapps@gmail.com">luvstorapps@gmail.com</a>.
      </p>
      <p>
        Please do not download, forward, or email suspected CSAM. A report with
        a profile name or account identifier and a brief description is enough
        for us to begin reviewing the concern.
      </p>
    </section>

    <section>
      <h2>How Luvstor responds</h2>
      <p>
        We review child-safety reports and other information that gives us
        actual knowledge of suspected abuse or exploitation. When we identify
        prohibited material or conduct, we will take appropriate steps to stop
        access and prevent continued use of Luvstor. Actions may include removing
        or disabling access to material, restricting or closing accounts, and
        preserving relevant records when required by law.
      </p>
      <p>
        We will report confirmed CSAM to the National Center for Missing &amp;
        Exploited Children (NCMEC) or the appropriate regional authority,
        consistent with applicable reporting requirements. We respond to lawful
        requests from authorities and comply with child-safety laws that apply
        to our service.
      </p>
    </section>

    <section>
      <h2>Enforcement</h2>
      <p>
        Violations can result in content removal, account restrictions,
        permanent account closure, and referral to the appropriate authorities.
        We may act without prior notice when necessary to protect a child,
        preserve safety, or meet a legal obligation. Users may also block
        accounts that make them feel unsafe.
      </p>
    </section>

    <section>
      <h2>Child safety contact</h2>
      <p>
        For child-safety concerns or official notices about these standards,
        contact the Luvstor Child Safety Team at{' '}
        <a href="mailto:luvstorapps@gmail.com">luvstorapps@gmail.com</a>. Please use
        the subject line “Child Safety”.
      </p>
    </section>
  </LegalLayout>
);

export default ChildSafety;