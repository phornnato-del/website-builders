import Link from "next/link";

function BrandMark() {
  return (
    <span aria-hidden="true" className="wb-brand-mark">
      <svg fill="none" viewBox="0 0 32 32">
        <path
          d="M7 9.5h18M7 16h18M7 22.5h11"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
        />
        <path
          d="m22 20 3 2.5-3 2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path
        d="M4.5 10h11m-4.5-4.5 4.5 4.5-4.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="wb-landing">
      <section className="wb-hero">
        <div aria-hidden="true" className="wb-hero-glow wb-hero-glow-one" />
        <div aria-hidden="true" className="wb-hero-glow wb-hero-glow-two" />

        <header className="wb-nav">
          <Link aria-label="WebBuilder home" className="wb-brand" href="/">
            <BrandMark />
            <span>webbuilder</span>
          </Link>
          <nav aria-label="Main navigation" className="wb-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
          </nav>
          <div className="wb-nav-actions">
            <Link className="wb-sign-in" href="/login">
              Sign in
            </Link>
            <Link className="wb-nav-cta" href="/register">
              Get started <ArrowIcon />
            </Link>
          </div>
        </header>

        <div className="wb-hero-content">
          <div className="wb-hero-copy">
            <div className="wb-eyebrow">
              <span className="wb-eyebrow-spark">✳</span>
              YOUR IDEAS, WITHOUT THE CODE
            </div>
            <h1>
              A beautiful website,
              <br />
              <span>made by you.</span>
            </h1>
            <p className="wb-hero-description">
              Turn that idea you can&apos;t stop thinking about into a website
              you can&apos;t wait to share. Just drag, drop, and make it yours.
            </p>
            <div className="wb-hero-actions">
              <Link className="wb-primary-cta" href="/register">
                Build your website <ArrowIcon />
              </Link>
              <Link className="wb-secondary-cta" href="/login">
                I already have an account
              </Link>
            </div>
            <div className="wb-social-proof">
              <div aria-hidden="true" className="wb-avatar-stack">
                <span>J</span>
                <span>M</span>
                <span>A</span>
                <span>K</span>
              </div>
              <p>
                <strong>Your next idea belongs online.</strong>
                <span>Start building for free today.</span>
              </p>
            </div>
          </div>

          <div
            aria-label="Preview of a website being designed in WebBuilder"
            className="wb-editor-scene"
            role="img"
          >
            <div aria-hidden="true" className="wb-orbit wb-orbit-one" />
            <div aria-hidden="true" className="wb-orbit wb-orbit-two" />
            <div className="wb-editor-window">
              <div className="wb-window-bar">
                <div aria-hidden="true" className="wb-window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="wb-window-url">your-next-big-idea.com</div>
                <span className="wb-window-status">
                  <i /> Live preview
                </span>
              </div>
              <div className="wb-editor-body">
                <div className="wb-editor-sidebar">
                  <div className="wb-side-brand">
                    <BrandMark />
                    <span>Editor</span>
                  </div>
                  <div className="wb-side-label">YOUR BLOCKS</div>
                  <div className="wb-block-item wb-block-active">
                    <span className="wb-block-symbol">T</span> Heading
                  </div>
                  <div className="wb-block-item">
                    <span className="wb-block-symbol wb-symbol-image">▧</span>{" "}
                    Image
                  </div>
                  <div className="wb-block-item">
                    <span className="wb-block-symbol wb-symbol-section">▤</span>{" "}
                    Section
                  </div>
                  <div className="wb-block-item">
                    <span className="wb-block-symbol wb-symbol-button">↗</span>{" "}
                    Button
                  </div>
                  <div className="wb-sidebar-divider" />
                  <div className="wb-layer-row">
                    <span>⌘</span> My first page
                  </div>
                  <div className="wb-layer-row wb-layer-muted">
                    <span>▤</span> Hero section
                  </div>
                </div>
                <div className="wb-canvas-wrap">
                  <div className="wb-canvas-toolbar">
                    <span>Home page</span>
                    <span className="wb-desktop-toggle">▣ &nbsp; Desktop</span>
                    <span className="wb-canvas-more">···</span>
                  </div>
                  <div className="wb-site-canvas">
                    <div className="wb-site-nav">
                      <span className="wb-site-logo">north.</span>
                      <span>About &nbsp;&nbsp; Work &nbsp;&nbsp; Contact</span>
                    </div>
                    <div className="wb-site-content">
                      <div className="wb-site-kicker">
                        <i /> DESIGN STUDIO · EST. 2024
                      </div>
                      <div className="wb-site-title">
                        Make room
                        <br />
                        for <em>good ideas.</em>
                      </div>
                      <div className="wb-site-subtitle">
                        Thoughtful design for a more
                        <br />
                        colorful kind of everyday.
                      </div>
                      <span className="wb-site-button">
                        Explore our work <ArrowIcon />
                      </span>
                    </div>
                    <div aria-hidden="true" className="wb-site-art">
                      <div className="wb-art-sun" />
                      <div className="wb-art-shape wb-art-shape-one" />
                      <div className="wb-art-shape wb-art-shape-two" />
                      <div className="wb-art-shape wb-art-shape-three" />
                    </div>
                    <div aria-hidden="true" className="wb-selection-box">
                      <span>Heading</span>
                      <i className="wb-selection-handle" />
                    </div>
                  </div>
                </div>
              </div>
              <div aria-hidden="true" className="wb-animated-cursor">
                <svg fill="none" viewBox="0 0 22 26">
                  <path
                    d="m2 2 17 13-7.5 1.1-3.8 7.2L2 2Z"
                    fill="#fff"
                    stroke="#173A8A"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>You</span>
              </div>
            </div>
            <div className="wb-floating-note">
              <span className="wb-note-check">✓</span>
              <span>
                <strong>Looking good!</strong>
                <small>Your site is coming together</small>
              </span>
              <span aria-hidden="true" className="wb-note-spark">✦</span>
            </div>
            <div aria-hidden="true" className="wb-floating-shape wb-shape-star">
              ✳
            </div>
          </div>
        </div>
        <a className="wb-scroll-cue" href="#how-it-works">
          <span /> Scroll to explore
        </a>
      </section>

      <section className="wb-intro" id="how-it-works">
        <div className="wb-section-heading">
          <span className="wb-section-eyebrow">YOUR WEBSITE, YOUR WAY</span>
          <h2>
            Big idea energy.
            <br />
            <span>Zero code required.</span>
          </h2>
          <p>
            You bring the idea. We bring the building blocks. Together, you
            make something that feels like you.
          </p>
        </div>
        <div className="wb-feature-grid" id="features">
          <article className="wb-feature-card">
            <div className="wb-feature-icon wb-icon-blue">
              <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
                <rect
                  height="18"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  width="22"
                  x="3"
                  y="5"
                />
                <path
                  d="M3 11h22M9 8h.01M12 8h.01M8 16h5M8 20h12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <h3>Build it your way</h3>
            <p>
              Add headings, images, sections, and more. Drag blocks around
              until it feels just right.
            </p>
            <span className="wb-feature-number">01</span>
          </article>
          <article className="wb-feature-card">
            <div className="wb-feature-icon wb-icon-lavender">
              <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
                <path
                  d="M14 3.5 17 10l7 .8-5.2 4.9 1.4 7-6.2-3.5-6.2 3.5 1.4-7L4 10.8l7-.8 3-6.5Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <h3>Make it unmistakably you</h3>
            <p>
              Play with colors, layouts, and imagery to create a site that
              looks like it could only be yours.
            </p>
            <span className="wb-feature-number">02</span>
          </article>
          <article className="wb-feature-card">
            <div className="wb-feature-icon wb-icon-mint">
              <svg aria-hidden="true" fill="none" viewBox="0 0 28 28">
                <path
                  d="M14 24s9-4.5 9-11V6l-9-3-9 3v7c0 6.5 9 11 9 11Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                <path
                  d="m10 14 2.5 2.5 5.5-5.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <h3>Share when you&apos;re ready</h3>
            <p>
              Preview as you go, then publish your site and put your idea out
              into the world.
            </p>
            <span className="wb-feature-number">03</span>
          </article>
        </div>
        <div className="wb-bottom-cta">
          <div>
            <span className="wb-bottom-spark">✦</span>
            <p>Your idea isn&apos;t going to build itself.</p>
          </div>
          <Link className="wb-bottom-link" href="/register">
            Let&apos;s make it real <ArrowIcon />
          </Link>
        </div>
      </section>

      <footer className="wb-footer">
        <Link aria-label="WebBuilder home" className="wb-brand wb-footer-brand" href="/">
          <BrandMark />
          <span>webbuilder</span>
        </Link>
        <span>Made for the ideas you can&apos;t stop thinking about.</span>
        <Link href="/login">Sign in <ArrowIcon /></Link>
      </footer>
    </main>
  );
}
