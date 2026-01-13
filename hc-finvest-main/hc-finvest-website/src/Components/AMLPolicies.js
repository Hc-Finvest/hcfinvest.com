import React from "react";
import { Helmet } from "react-helmet-async";

 const AMLPolicy = () => {
  return (
    <>
        <Helmet>
          <link rel="canonical" href="https://www.hcfinvest.com/amlPolicies" />
        </Helmet>

            <div className="container mt-5 font-poppins leading-loose">
      <h3 className="text-4xl font-medium mb-2">
        ANTI-MONEY LAUNDERING (AML) POLICY
      </h3>

      <h4 className="text-2xl font-bold mt-6">1. Introduction</h4>
      <p>
        HC Finvest is committed to preventing money laundering, fraud, and
        terrorist financing activities. We adhere to SVGFSA (Saint Vincent and
        the Grenadines Financial Services Authority) regulations and
        international AML laws to ensure a secure and transparent trading
        environment.
      </p>

      <h4 className="text-2xl font-bold mt-6">2. Objectives</h4>
      <ul className="list-disc ml-6">
        <li>
          <p>
            Detect and prevent financial crimes such as money laundering and
            terrorist financing.
          </p>
        </li>
        <li>
          <p>
            Comply with <b>Know Your Customer (KYC)</b> and <b>AML</b>
            regulations.
          </p>
        </li>
        <li>
          <p>
            Monitor and report suspicious transactions to <b>SVGFSA</b> and
            relevant authorities.
          </p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">
        3. Customer Due Diligence (CDD)
      </h4>
      <p>HC Finvest follows strict identity verification procedures:</p>

      <p className="font-bold mt-3">For Individual Accounts :-</p>
      <ul className="list-disc ml-6">
        <li>
          <p>Government-issued ID (passport, national ID, driver’s license)</p>
        </li>
        <li>
          <p>Proof of address (utility bill, bank statement, etc.)</p>
        </li>
      </ul>

      <p className="font-bold mt-4">For Corporate Accounts :-</p>
      <ul className="list-disc ml-6">
        <li>
          <p>Certificate of incorporation (issued by SVGFSA)</p>
        </li>
        <li>
          <p>
            Details of directors and <b>Ultimate Beneficial Owners (UBOs)</b>
          </p>
        </li>
        <li>
          <p>Corporate structure and business activity verification</p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">
        4. Enhanced Due Diligence (EDD)
      </h4>
      <p>
        For high-risk clients (e.g., PEPs, large transactions, offshore
        companies), additional checks are conducted:
      </p>
      <ul className="list-disc ml-6">
        <li>
          <p>Source of funds verification</p>
        </li>
        <li>
          <p>Detailed transaction monitoring</p>
        </li>
        <li>
          <p>Periodic account reviews</p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">
        5. Transaction Monitoring & Reporting
      </h4>
      <ul className="list-disc ml-6">
        <li>
          <p>
            <b>Suspicious Activity Detection :-</b> Automated systems flag
            unusual deposits, withdrawals, or trading patterns.
          </p>
        </li>
        <li>
          <p>
            <b>Red Flags :-</b> Large, rapid deposits or withdrawals, multiple
            accounts, unusual forex trades.
          </p>
        </li>
        <li>
          <p>
            <b>Reporting :-</b> Suspicious activities are reported to
            <b> SVGFSA </b>and other regulators.
          </p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">6. Prohibited Activities</h4>
      <p>HC Finvest strictly prohibits:</p>
      <ul className="list-disc ml-6">
        <li>
          <p>Anonymous accounts or fake identities</p>
        </li>
        <li>
          <p>Third-party deposits or withdrawals</p>
        </li>
        <li>
          <p>
            Transactions linked to <b>sanctioned countries/entities</b>
          </p>
        </li>
        <li>
          <p>Cryptocurrency funding without proper verification</p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">
        7. Compliance & Employee Training
      </h4>
      <ul className="list-disc ml-6">
        <li>
          <p>Employees undergo regular AML training.</p>
        </li>
        <li>
          <p>Non-compliance results in penalties or account suspension.</p>
        </li>
        <li>
          <p>Regular audits ensure policy effectiveness.</p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">
        8. Regulatory Compliance – SVGFSA
      </h4>
      <p>
        HC Finvest complies with <b>SVGFSA regulations</b>, ensuring:
      </p>
      <ul className="list-disc ml-6">
        <li>
          <p>
            Full adherence to <b>AML/CFT guidelines</b>.
          </p>
        </li>
        <li>
          <p>
            Periodic <b>compliance audits</b> by SVGFSA.
          </p>
        </li>
        <li>
          <p>
            Reporting suspicious transactions to the
            <b> Financial Intelligence Unit (FIU)</b> of Saint Vincent and the
            Grenadines.
          </p>
        </li>
        <li>
          <p>
            Maintaining AML records for at least <b>5 years</b>, as required.
          </p>
        </li>
      </ul>

      <h4 className="text-2xl font-bold mt-6">9. Conclusion</h4>
      <p>
        This policy ensures compliance with <b>SVGFSA AML regulations</b> and
        protects our platform from illegal activities. Clients must adhere to
        these rules for a safe and transparent trading experience.
      </p>
    </div>
    </>
  );
}

export default AMLPolicy;