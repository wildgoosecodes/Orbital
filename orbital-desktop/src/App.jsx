import { useEffect, useState } from 'react';
import LoginView from './components/LoginView';
import MainView from './components/MainView';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(null); // null = still checking

  useEffect(() => {
    window.orbital.restoreSession().then(({ loggedIn }) => setLoggedIn(loggedIn));
  }, []);

  async function handleSignIn(email, password) {
    const result = await window.orbital.signIn(email, password);
    if (result.success) setLoggedIn(true);
    return result;
  }

  async function handleSignOut() {
    await window.orbital.signOut();
    setLoggedIn(false);
  }

  if (loggedIn === null) {
    return <div className="h-full bg-slate-950" />;
  }

  return loggedIn ? <MainView onSignOut={handleSignOut} /> : <LoginView onSignIn={handleSignIn} />;
}
