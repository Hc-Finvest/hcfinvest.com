// Seed default email templates
// Run: node scripts/seedEmailTemplates.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import EmailTemplate from '../models/EmailTemplate.js'

dotenv.config()

const defaultTemplates = [
  {
    name: 'OTP - Signup',
    slug: 'otp-signup',
    subject: 'Your Verification Code - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent during user signup',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>Email Verification - HC Finvest</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Thank
                                                                                          you
                                                                                          for
                                                                                          registering
                                                                                          with
                                                                                          our
                                                                                          application.
                                                                                          We&#x27;re
                                                                                          thrilled
                                                                                          to
                                                                                          have
                                                                                          you
                                                                                          on
                                                                                          board.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                        <p>Your One-Time Password (OTP) is:</p>
                                                                                        
                                                                                        <div style="text-align:center;margin:20px 0;">
                                                                                          <span style="
                                                                                            font-size:28px;
                                                                                            letter-spacing:8px;
                                                                                            font-weight:bold;
                                                                                            color:#1f2f5a;
                                                                                            background:#f1f3f8;
                                                                                            padding:12px 20px;
                                                                                            border-radius:8px;
                                                                                            display:inline-block;
                                                                                          ">
                                                                                            {{otp}}
                                                                                          </span>
                                                                                        </div>

                                                                                        <p>This OTP is valid for 5 minutes.</p>
                                                                                        <p>If you did not request this, please ignore this email.</p>


                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
    </html>`
  },
  {
    name: 'OTP - Password Reset',
    slug: 'otp-password_reset',
    subject: 'Password Reset OTP - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'OTP email sent for password reset',
    placeholders: [
      { key: 'otp', description: 'The 6-digit OTP code', example: '123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' },
      { key: 'expiry_minutes', description: 'OTP expiry time in minutes', example: '10' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Password Reset</h2>
              <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                Use the following OTP to reset your password. This code is valid for <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f97316;">{{otp}}</span>
              </div>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to {{app_name}}! 🎉',
    category: 'transactional',
    isSystem: true,
    description: 'Welcome email sent after successful registration',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email address', example: 'john@example.com' },
      { key: 'password', description: 'User password', example: '********' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }

    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <h2
                                                                                          style="margin:0;padding:0;color:#1f2f5a">
                                                                                          Welcome
                                                                                          to
                                                                                          HC
                                                                                          Finvest
                                                                                        </h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Congratulations,
                                                                                          <strong
                                                                                            >{{user_name}}</strong
                                                                                          >
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Thank
                                                                                          you
                                                                                          for
                                                                                          registering
                                                                                          with
                                                                                          our
                                                                                          application.
                                                                                          We&#x27;re
                                                                                          thrilled
                                                                                          to
                                                                                          have
                                                                                          you
                                                                                          on
                                                                                          board.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Login
                                                                                            Credentials:</strong
                                                                                          >
                                                                                        </p>
                                                                                        <table
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:20px;margin-right:0;margin-bottom:20px;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;border-style:solid;border-width:1px;border-color:#ddd;border-radius:6px;background:#f9fafc">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <br />
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <strong
                                                                                                        >Full
                                                                                                        Name
                                                                                                        :</strong
                                                                                                      >
                                                                                                    </p>
                                                                                                  </td>
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      {{user_name}}
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <strong
                                                                                                        >Email
                                                                                                        :</strong
                                                                                                      >
                                                                                                    </p>
                                                                                                  </td>
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      {{email}}
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0">
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      <strong
                                                                                                        >Password
                                                                                                        :</strong
                                                                                                      >
                                                                                                    </p>
                                                                                                  </td>
                                                                                                  <td
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <p
                                                                                                      style="margin:0;padding:0">
                                                                                                      {{password}}
                                                                                                    </p>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`
  },
  {
    name: 'Password Reset Link',
    slug: 'password-reset',
    subject: 'Reset Your Password - {{app_name}}',
    category: 'authentication',
    isSystem: true,
    description: 'Password reset link email',
    placeholders: [
      { key: 'reset_url', description: 'Password reset URL', example: 'https://example.com/reset?token=xxx' },
      { key: 'expiry_minutes', description: 'Link expiry time in minutes', example: '60' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">{{app_name}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                This link will expire in <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <p style="margin: 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © {{year}} {{app_name}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
    {
    name: 'Deposit Request',
    slug: 'deposit-request',
    subject: 'Deposit Request Received - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a deposit request is received from a user.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Deposit amount', example: '$500' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>Deposit Request Received</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Hello,
                                                                                          <<strong>{{user_name}}</strong>
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                         Your deposit request has been successfully received and is currently under review.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>Deposit Details:</strong></p>

                                                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                      style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                      <tr>
                                                                                        <td><strong>Full Name :</strong></td>
                                                                                        <td>{{user_name}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Email :</strong></td>
                                                                                        <td>{{email}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Amount :</strong></td>
                                                                                        <td>{{amount}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Payment Method :</strong></td>
                                                                                        <td>{{method}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Transaction ID :</strong></td>
                                                                                        <td>{{txn_id}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Status :</strong></td>
                                                                                        <td style="color:#e67e22;font-weight:bold;">Pending</td>
                                                                                      </tr>

                                                                                    </table>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>
`
  },
    {
    name: 'Withdrawal Request',
    slug: 'withdrawal-request',
    subject: 'Withdrawal Request Received - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a withdrawal request is received from a user.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Withdrawal amount', example: '$500' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>Withdrawal Request Received</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Hello,
                                                                                          <<strong>{{user_name}}</strong>
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                         Your withdrawal request has been successfully received and is currently under review.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>Withdrawal Details:</strong></p>

                                                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                      style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                      <tr>
                                                                                        <td><strong>Full Name :</strong></td>
                                                                                        <td>{{user_name}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Email :</strong></td>
                                                                                        <td>{{email}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Amount :</strong></td>
                                                                                        <td>{{amount}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Payment Method :</strong></td>
                                                                                        <td>{{method}}</td>
                                                                                      </tr>

                                                                                      
                                                                                      <tr>
                                                                                        <td><strong>Status :</strong></td>
                                                                                        <td style="color:#e67e22;font-weight:bold;">Pending</td>
                                                                                      </tr>

                                                                                    </table>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`
  },
  {
    name: 'Deposit Confirmation',
    slug: 'deposit-confirmation',
    subject: 'Deposit Confirmed - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a deposit is confirmed',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'amount', description: 'Deposit amount', example: '$1,000' },
      { key: 'payment_method', description: 'Payment method', example: 'Bank Transfer' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>Deposit Approved ✅</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Hello,
                                                                                          <strong>{{user_name}}</strong>
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                         Your deposit has been successfully approved and credited to your trading account.
                                                                                        </p>
                                                                                        <p style="margin-top:15px;">
                                                                                          Your funds are now available in your account and ready for trading.
                                                                                          </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>Deposit Details:</strong></p>

                                                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                      style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                      <tr>
                                                                                        <td><strong>Full Name :</strong></td>
                                                                                        <td>{{user_name}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Email :</strong></td>
                                                                                        <td>{{email}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Amount :</strong></td>
                                                                                        <td>{{amount}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Payment Method :</strong></td>
                                                                                        <td>{{method}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Transaction ID :</strong></td>
                                                                                        <td>{{txn_id}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Status :</strong></td>
                                                                                        <td style="color:#27ae60;font-weight:bold;">Approved</td>
                                                                                      </tr>

                                                                                    </table>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Start Trading</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`
  },
  {
    name: 'Withdrawal Confirmation',
    slug: 'withdrawal-confirmation',
    subject: 'Withdrawal Processed - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a withdrawal is processed',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'amount', description: 'Withdrawal amount', example: '$500' },
      { key: 'transaction_id', description: 'Transaction ID', example: 'TXN123456' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>Withdrawal Approved ✅</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Hello,
                                                                                          <strong>{{user_name}}</strong>
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                         Your withdrawal has been successfully approved and will be processed shortly.
                                                                                        </p>
                                                                                        <p style="margin-top:15px;">
                                                                                          Your funds will be available in your account once the withdrawal is completed.
                                                                                          </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>Withdrawal Details:</strong></p>

                                                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                      style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                      <tr>
                                                                                        <td><strong>Full Name :</strong></td>
                                                                                        <td>{{user_name}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Email :</strong></td>
                                                                                        <td>{{email}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Amount :</strong></td>
                                                                                        <td>{{amount}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Payment Method :</strong></td>
                                                                                        <td>{{method}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Transaction ID :</strong></td>
                                                                                        <td>{{txn_id}}</td>
                                                                                      </tr>

                                                                                      <tr>
                                                                                        <td><strong>Status :</strong></td>
                                                                                        <td style="color:#27ae60;font-weight:bold;">Approved</td>
                                                                                      </tr>

                                                                                    </table>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Login to Your Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`
  },
  {
    name: 'KYC Verification Request',
    slug: 'kyc-verification-request',
    subject: 'KYC Verification Request Received - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a KYC verification request is received from a user.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'documenttype', description: 'Document type', example: 'Passport' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>KYC Verification Request Received</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Hello, <strong>{{user_name}}</strong>
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                            Your KYC verification request has been successfully submitted and is currently under review by our compliance team.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>KYC Details:</strong></p>

                                                                                              <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                                style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                                <tr>
                                                                                                  <td><strong>Full Name :</strong></td>
                                                                                                  <td>{{user_name}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Email :</strong></td>
                                                                                                  <td>{{email}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Document Type :</strong></td>
                                                                                                  <td>{{doc_type}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Document Number :</strong></td>
                                                                                                  <td>{{doc_number}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Status :</strong></td>
                                                                                                  <td style="color:#e67e22;font-weight:bold;">Under Review</td>
                                                                                                </tr>

                                                                                              </table>

                                                                                              <p style="margin-top:15px;">
                                                                                                Our team is currently verifying your documents. This process usually takes 24–48 hours.
                                                                                                </p>

                                                                                                <p>
                                                                                                You will be notified once your KYC is approved or if additional information is required.
                                                                                                </p>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`
  },

    {
    name: 'KYC Verification Confirmation',
    slug: 'kyc-verification-confirmation',
    subject: 'KYC Verification Confirmation - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a KYC verification is approved.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'documenttype', description: 'Document type', example: 'Passport' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿#160;
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                          <h2>KYC Verification Request Received</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Hello, <strong>{{user_name}}</strong>
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                            Your KYC verification request has been successfully submitted and is currently under review by our compliance team.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>KYC Details:</strong></p>

                                                                                              <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                                style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                                <tr>
                                                                                                  <td><strong>Full Name :</strong></td>
                                                                                                  <td>{{user_name}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Email :</strong></td>
                                                                                                  <td>{{email}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Document Type :</strong></td>
                                                                                                  <td>{{doc_type}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Document Number :</strong></td>
                                                                                                  <td>{{doc_number}}</td>
                                                                                                </tr>

                                                                                                <tr>
                                                                                                  <td><strong>Status :</strong></td>
                                                                                                  <td style="color:#e67e22;font-weight:bold;">Under Review</td>
                                                                                                </tr>

                                                                                              </table>

                                                                                              <p style="margin-top:15px;">
                                                                                                Our team is currently verifying your documents. This process usually takes 24–48 hours.
                                                                                                </p>

                                                                                                <p>
                                                                                                You will be notified once your KYC is approved or if additional information is required.
                                                                                                </p>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`
  },

      {
    name: 'Competition Joined Notification',
    slug: 'competition-joined',
    subject: 'You\'ve Joined a Competition - {{app_name}}',
    category: 'transactional',
    isSystem: false,
    description: 'Email sent when a user joins a competition.',
    placeholders: [
      { key: 'user_name', description: 'User first name', example: 'John' },
      { key: 'email', description: 'User email', example: 'john@example.com' },
      { key: 'competition_name', description: 'Competition name', example: 'Weekly Trading Challenge' },
      { key: 'start_date', description: 'Competition start date', example: '2023-10-01' },
      { key: 'end_date', description: 'Competition end date', example: '2023-10-31' },
      { key: 'app_name', description: 'Application name', example: 'HC Finvest' }
    ],
    htmlContent: `<!DOCTYPE html>
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link
      rel="preload"
      as="image"
      href="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta
      content="telephone=no,address=no,email=no,date=no,url=no"
      name="format-detection" />
  </head>
  <body>
    <!--$--><!--html--><!--head-->
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
      data-skip-in-text="true">
      Trade with 0.0 spreads and zero commission today.
      <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
      </div>
    </div>
    <!--body-->
    <table
      border="0"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      align="center">
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="font-weight:600">
              <tbody>
                <tr>
                  <td>
                    <table
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <table
                              align="center"
                              width="100%"
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              role="presentation"
                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td
                                        data-id="__react-email-column"
                                        style="margin:0;padding:0">
                                        <table
                                          align="center"
                                          width="100%"
                                          border="0"
                                          cellpadding="0"
                                          cellspacing="0"
                                          role="presentation"
                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-weight:600">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td
                                                    data-id="__react-email-column"
                                                    style="margin:0;padding:0">
                                                    <table
                                                      width="100%"
                                                      border="0"
                                                      cellpadding="0"
                                                      cellspacing="0"
                                                      role="presentation"
                                                      style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;width:100%">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr
                                                              style="margin:0;padding:0">
                                                              <td
                                                                data-id="__react-email-column"
                                                                style="margin:0;padding:0">
                                                                <table
                                                                  width="100%"
                                                                  border="0"
                                                                  cellpadding="0"
                                                                  cellspacing="0"
                                                                  role="presentation"
                                                                  style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:20px;padding-right:20px;padding-bottom:20px;padding-left:20px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <p
                                                                              style="margin:0;padding:0">
                                                                              <br />
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                        <tr
                                                                          style="margin:0;padding:0">
                                                                          <td
                                                                            align="center"
                                                                            data-id="__react-email-column"
                                                                            style="margin:0;padding:0">
                                                                            <table
                                                                              width="600"
                                                                              border="0"
                                                                              cellpadding="0"
                                                                              cellspacing="0"
                                                                              role="presentation"
                                                                              style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;background:#ffffff;border-style:solid;border-width:3px;border-color:#1f2f5a;border-radius:10px;overflow:hidden">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:0">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:10px 20px;text-align:center">
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
                                                                                          <br />
                                                                                        </p>
                                                                                        <table
                                                                                          align="center"
                                                                                          width="100%"
                                                                                          border="0"
                                                                                          cellpadding="0"
                                                                                          cellspacing="0"
                                                                                          role="presentation"
                                                                                          style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                                                          <tbody>
                                                                                            <tr>
                                                                                              <td>
                                                                                                <tr
                                                                                                  style="margin:0;padding:0;width:100%">
                                                                                                  <td
                                                                                                    align="left"
                                                                                                    data-id="__react-email-column"
                                                                                                    style="margin:0;padding:0">
                                                                                                    <img
                                                                                                      alt="The HC Finvest logo features a dark blue abstract &#x27;H&#x27; shape next to the company name in a dark blue script font."
                                                                                                      height="120"
                                                                                                      src="https://resend-attachments.s3.amazonaws.com/0b60ef3a-1446-4b0d-bf02-d33037bbfeee"
                                                                                                      style="display:block;outline:none;border:none;text-decoration:none;border-bottom:1px solid black"
                                                                                                      width="600" />
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </td>
                                                                                            </tr>
                                                                                          </tbody>
                                                                                        </table>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <h2>Competition Joined Successfully 🎉</h2>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;color:#333;font-size:14px;line-height:1.6">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Congratulations,
                                                                                          <strong
                                                                                            >{{user_name}}</strong
                                                                                          >
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          You have successfully joined the competition. Get ready to trade and compete with other participants.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>

                                                                                          <p><strong>Competition Details:</strong></p>

                                                                                            <table width="100%" border="0" cellpadding="0" cellspacing="0"
                                                                                              style="margin-top:20px;margin-bottom:20px;border:1px solid #ddd;border-radius:6px;background:#f9fafc;padding:10px">

                                                                                              <tr>
                                                                                                <td><strong>Participant Name :</strong></td>
                                                                                                <td>{{user_name}}</td>
                                                                                              </tr>

                                                                                              <tr>
                                                                                                <td><strong>Email :</strong></td>
                                                                                                <td>{{email}}</td>
                                                                                              </tr>

                                                                                              <tr>
                                                                                                <td><strong>Competition Name :</strong></td>
                                                                                                <td>{{competition_name}}</td>
                                                                                              </tr>

                                                                                              <tr>
                                                                                                <td><strong>Start Date :</strong></td>
                                                                                                <td>{{start_date}}</td>
                                                                                              </tr>

                                                                                              <tr>
                                                                                                <td><strong>End Date :</strong></td>
                                                                                                <td>{{end_date}}</td>
                                                                                              </tr>

                                                                                              <tr>
                                                                                                <td><strong>Status :</strong></td>
                                                                                                <td style="color:#27ae60;font-weight:bold;">Joined</td>
                                                                                              </tr>

                                                                                            </table>

                                                                                            <p style="margin-top:15px;">
                                                                                              Your account is now enrolled in the competition. Make sure to follow the rules and maximize your trading performance.
                                                                                              </p>
                                                                                              <p>
                                                                                                Best of luck — may the best trader win! 🚀
                                                                                                </p>

                                                                                        <div
                                                                                          style="margin:30px 0;padding:0;text-align:center">
                                                                                          <p
                                                                                            style="margin:0;padding:0">
                                                                                            <span
                                                                                              style="color:#ffffff;text-decoration-line:none;background:#1f2f5a;padding:12px 28px;text-decoration:none;border-radius:25px;display:inline-block;font-size:14px"
                                                                                              ><a
                                                                                                href="https://trade.hcfinvest.com/user/login"
                                                                                                rel="noopener noreferrer nofollow"
                                                                                                style="color:#067df7;text-decoration-line:none"
                                                                                                target="_blank"
                                                                                                >Log
                                                                                                In
                                                                                                to
                                                                                                Your
                                                                                                Account</a
                                                                                              ></span
                                                                                            >
                                                                                          </p>
                                                                                        </div>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          If
                                                                                          you
                                                                                          need
                                                                                          any
                                                                                          assistance,
                                                                                          our
                                                                                          24/5
                                                                                          support
                                                                                          team
                                                                                          is
                                                                                          always
                                                                                          here
                                                                                          to
                                                                                          help.
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <br />
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          Regards,<br /><strong
                                                                                            >HC
                                                                                            Finvest
                                                                                            (Heddge
                                                                                            Capitals
                                                                                            Wealth
                                                                                            Management
                                                                                            LLC)</strong
                                                                                          ><br />support@heddgecapitals.com<br />www.hcfinvest.com
                                                                                        </p>
                                                                                        <p
                                                                                          style="margin:0;padding:0;margin-top:20px">
                                                                                          <strong
                                                                                            >Note:</strong
                                                                                          >
                                                                                          For
                                                                                          your
                                                                                          security,
                                                                                          please
                                                                                          change
                                                                                          your
                                                                                          password
                                                                                          after
                                                                                          your
                                                                                          first
                                                                                          login.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:20px 30px;font-size:11px;color:#666;line-height:1.5;border-top:1px solid #eee">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          <strong
                                                                                            >Risk
                                                                                            warning:</strong
                                                                                          >
                                                                                          Forex
                                                                                          and
                                                                                          CFD
                                                                                          trading
                                                                                          carry
                                                                                          a
                                                                                          high
                                                                                          level
                                                                                          of
                                                                                          risk
                                                                                          and
                                                                                          may
                                                                                          not
                                                                                          be
                                                                                          suitable
                                                                                          for
                                                                                          all
                                                                                          investors.
                                                                                          These
                                                                                          instruments
                                                                                          are
                                                                                          complex
                                                                                          and
                                                                                          involve
                                                                                          the
                                                                                          use
                                                                                          of
                                                                                          leverage,
                                                                                          which
                                                                                          can
                                                                                          amplify
                                                                                          both
                                                                                          gains
                                                                                          and
                                                                                          losses.
                                                                                          Before
                                                                                          engaging
                                                                                          in
                                                                                          trading,
                                                                                          you
                                                                                          should
                                                                                          carefully
                                                                                          consider
                                                                                          your
                                                                                          investment
                                                                                          objectives,
                                                                                          level
                                                                                          of
                                                                                          experience,
                                                                                          and
                                                                                          risk
                                                                                          appetite.
                                                                                          There
                                                                                          is
                                                                                          a
                                                                                          possibility
                                                                                          that
                                                                                          you
                                                                                          could
                                                                                          sustain
                                                                                          a
                                                                                          loss
                                                                                          of
                                                                                          some
                                                                                          or
                                                                                          all
                                                                                          of
                                                                                          your
                                                                                          invested
                                                                                          capital,
                                                                                          and
                                                                                          therefore
                                                                                          you
                                                                                          should
                                                                                          not
                                                                                          invest
                                                                                          money
                                                                                          that
                                                                                          you
                                                                                          cannot
                                                                                          afford
                                                                                          to
                                                                                          lose.
                                                                                          You
                                                                                          are
                                                                                          strongly
                                                                                          advised
                                                                                          to
                                                                                          seek
                                                                                          independent
                                                                                          financial
                                                                                          advice
                                                                                          before
                                                                                          making
                                                                                          any
                                                                                          trading
                                                                                          decisions.
                                                                                          HC
                                                                                          Finvest
                                                                                          (Heddge
                                                                                          Capitals)
                                                                                          does
                                                                                          not
                                                                                          guarantee
                                                                                          any
                                                                                          profits
                                                                                          and
                                                                                          is
                                                                                          not
                                                                                          liable
                                                                                          for
                                                                                          any
                                                                                          losses
                                                                                          incurred.
                                                                                          Trading
                                                                                          should
                                                                                          only
                                                                                          be
                                                                                          undertaken
                                                                                          by
                                                                                          individuals
                                                                                          who
                                                                                          fully
                                                                                          understand
                                                                                          the
                                                                                          risks
                                                                                          involved.
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                    <tr
                                                                                      style="margin:0;padding:0">
                                                                                      <td
                                                                                        align="center"
                                                                                        data-id="__react-email-column"
                                                                                        style="margin:0;padding:15px;background:#1f2f5a;color:#ffffff;text-align:center;font-size:12px">
                                                                                        <p
                                                                                          style="margin:0;padding:0">
                                                                                          ©
                                                                                          2026
                                                                                          Heddge
                                                                                          Capitals
                                                                                          Wealth
                                                                                          Management
                                                                                          LLC.<br />All
                                                                                          rights
                                                                                          reserved.<br /><span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/privacyPolicies"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >Privacy
                                                                                              Policy</a
                                                                                            ></span
                                                                                          >
                                                                                          |
                                                                                          <span
                                                                                            style="text-decoration-thickness:initial"
                                                                                            ><a
                                                                                              href="https://www.hcfinvest.com/"
                                                                                              rel="noopener noreferrer nofollow"
                                                                                              style="color:#067df7;text-decoration-line:none"
                                                                                              target="_blank"
                                                                                              >hcfinvest.com</a
                                                                                            ></span
                                                                                          >
                                                                                        </p>
                                                                                      </td>
                                                                                    </tr>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                                <p
                                                                  style="margin:0;padding:0">
                                                                  <br />
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <p style="margin:0;padding:0"><br /></p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--/$-->
  </body>
</html>`
  },



]

async function seedTemplates() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hcf'
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    for (const template of defaultTemplates) {
      const existing = await EmailTemplate.findOne({ slug: template.slug })
      if (existing) {
        await EmailTemplate.updateOne({ slug: template.slug }, template)
        console.log(`Updated template: ${template.slug}`)
        continue
      }

      await EmailTemplate.create(template)
      console.log(`Created template: ${template.slug}`)
    }

    console.log('\n✅ Email templates seeded successfully!')
    await mongoose.disconnect()
    process.exit(0)

  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seedTemplates()
