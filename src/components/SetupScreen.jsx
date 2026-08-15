export default function SetupScreen() {
  return (
    <main className="setup-screen safe-screen">
      <section className="setup-card glass-panel">
        <div className="brand-mark brand-mark-small">UNO</div>
        <h1>Firebase setup required</h1>
        <p>
          This project already contains the Firebase project settings and Realtime Database URL.
          If you see this screen, one of the environment values is missing or was changed.
        </p>
        <div className="setup-steps">
          <div><b>1</b><span>Check that the project <code>.env</code> file exists</span></div>
          <div><b>2</b><span>Firebase Console → Authentication → Sign-in method → enable <strong>Anonymous</strong></span></div>
          <div><b>3</b><span>Realtime Database → Rules → paste <code>firebase.rules.json</code> → Publish</span></div>
          <div><b>4</b><span>Restart <code>npm run dev</code> after any <code>.env</code> change</span></div>
        </div>
      </section>
    </main>
  )
}
