import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/TradingDetailsBoxStyle.css";

const TradingDetailsBox = () => {
  return (
    <div className="start">
      <div className="overlaay text-center">
        <div className="container">
          {/* --- Heading Section --- */}
          <h2 className="mb-3 text-white" style={{ fontSize: "2rem" }}>
            Begin Your Trading Experience with{" "}
            <span style={{ color: "#ff8c00", fontWeight: 700 }}>
              HC Finvest
            </span>
          </h2>
          <p className="mb-4 fs-5 text-white">It's simple and fast to join!</p>

          {/* --- Cards Section --- */}
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
            {/* ---- CARD 1 ---- */}
            <div className="col">
              <div className="card-box d-flex flex-column h-100">
                <div className="text-start mb-1">
                  <strong>Full Name</strong>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    value="Ronald Mark"
                    disabled
                    className="custom-input"
                  />
                  <div className="text-start mt-1">
                    <strong>Country</strong>
                  </div>
                  <input
                    type="text"
                    value="United States"
                    disabled
                    className="custom-input"
                  />
                  <div className="text-start mt-1">
                    <strong>Client Type</strong>
                  </div>
                  <select disabled className="custom-select">
                    <option selected>Individual</option>
                  </select>
                  <div className="text-start mt-1">
                    <strong>Email Address</strong>
                  </div>
                  <input
                    type="email"
                    value="Rona@email.com"
                    disabled
                    className="custom-input"
                  />
                </div>

                <div className="mt-auto">
                  <button className="btn btn-purple w-100" disabled>
                    Register
                  </button>
                  <div className="text-start mt-3">
                    <div className="step-label">01</div>
                    <div className="step-title">REGISTER</div>
                    <p className="small">
                      Complete registration, log in to your Client Area and
                      upload required documents.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- CARD 2 ---- */}
            <div className="col">
              <div className="card-box d-flex flex-column h-100">
                <div className="text-start mb-2">
                  <strong>CREATE ACCOUNT</strong>
                </div>
                <div className="flex-grow-1">
                  <div className="text-start">
                    <strong>Account Type</strong>
                  </div>
                  <select disabled className="custom-select">
                    <option selected>Standard</option>
                  </select>

                  <div className="text-start mt-2">
                    <strong>Currency</strong>
                  </div>
                  <select disabled className="custom-select">
                    <option selected>USD</option>
                  </select>

                  <div className="text-start mt-2">
                    <strong>Leverage</strong>
                  </div>
                  <select disabled className="custom-select">
                    <option selected>1:2000</option>
                  </select>
                </div>

                <div className="mt-auto">
                  <button className="btn btn-purple w-100" disabled>
                    Create an Account
                  </button>
                  <div className="text-start mt-3">
                    <div className="step-label">02</div>
                    <div className="step-title">CREATE AN ACCOUNT</div>
                    <p className="small">
                      Once your documents are approved, create a Live Trading
                      account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- CARD 3 ---- */}
            <div className="col">
              <div className="card-box d-flex flex-column h-100">
                <div className="text-start mb-2">
                  <strong>DEPOSIT 1</strong>
                </div>
                <div className="flex-grow-1">
                  <div className="text-start">
                    <strong>Select Account</strong>
                  </div>
                  <select disabled className="custom-select">
                    <option selected>USD Available Balance</option>
                  </select>

                  <div className="text-start mt-3">
                    <strong>DEPOSIT 2</strong>
                  </div>
                  <div className="text-start">
                    <strong>Select Deposit Method</strong>
                  </div>
                  <select disabled className="custom-select">
                    <option selected>Bank Transfer</option>
                  </select>
                </div>

                <div className="mt-auto">
                  <button className="btn btn-purple w-100" disabled>
                    Make a Deposit
                  </button>
                  <div className="text-start mt-3">
                    <div className="step-label">03</div>
                    <div className="step-title">MAKE A DEPOSIT</div>
                    <p className="small">
                      Select a payment method, fund your trading account and
                      start trading.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- CARD 4 ---- */}
            <div className="col">
              <div className="card-box d-flex flex-column h-100">
                <div>
                  <h5 className="mb-2">🚀 Ready to Go Live?</h5>
                  <p className="small">
                    Click Buy or Sell to place your first trade and enter the
                    market confidently.
                  </p>
                </div>

                {/* Simple static candlestick effect */}
                <div className="candlestick-chart my-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`candle candle-${n} ${
                        n % 2 === 0 ? "bearish" : "bullish"
                      }`}
                    >
                      <div className="wick"></div>
                      <div className="body"></div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between gap-2">
                    <button className="btn btn-buy w-50" disabled>
                      Buy
                    </button>
                    <button className="btn btn-sell w-50" disabled>
                      Sell
                    </button>
                  </div>
                  <div className="text-start mt-3">
                    <div className="step-label">04</div>
                    <div className="step-title">START TRADING</div>
                    <p className="small">
                      You're all set. Enter the market and begin your trading
                      journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Footer Buttons --- */}
          <div className="big-buttons mt-5 d-flex flex-column flex-md-row justify-content-center align-items-center gap-3">
            <button className="btn" style={{ backgroundColor: "#ff8c00", color: "white", border: "none" }}>
              <a
                href="https://trade.hcfinvest.com/user/signup"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                Create Account
              </a>
            </button>
            <button className="btn btn-outline-light">
              <a
                href="https://trade.hcfinvest.com/user/login"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                Demo Account
              </a>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDetailsBox;
