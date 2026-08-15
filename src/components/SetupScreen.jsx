export default function SetupScreen() {
  return (
    <main className="setup-screen safe-screen v8-system-screen">
      <div className="v8-felt-bg" aria-hidden="true" />
      <section className="v8-system-card">
        <div className="v8-logo-lockup v8-logo-lockup-small"><span className="v8-logo-uno">UNO</span><span className="v8-logo-duel">DUEL</span></div>
        <h1>Table not connected</h1>
        <p>The game is missing its Firebase configuration.</p>
        <div className="v8-system-steps">
          <div><b>1</b><span>Check the project <code>.env</code></span></div>
          <div><b>2</b><span>Enable Anonymous Authentication</span></div>
          <div><b>3</b><span>Publish <code>firebase.rules.json</code></span></div>
          <div><b>4</b><span>Restart the app</span></div>
        </div>
      </section>
    </main>
  )
}
