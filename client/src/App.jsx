import { useState } from "react";
import { useEffect } from "react";
import "./App.css";

function App() {
  const [info, setInfo] = useState("");
  //create a state that stores and updates info

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [profile, setProfile] = useState(null);

  const fetchProfile = () => {
    fetch("http://localhost:3000/profile", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setProfile(data);
      });
  };

  const handleLogin = () => {
    fetch("http://localhost:3000/login", {
      method: "POST",
      credentials: "include",
      //sends a request to an login endpoint and sending information
      headers: {
        "Content-Type": "application/json",
      },
      //tells express that the information is in JSON format

      body: JSON.stringify({
        email: email,
        password: password,
      }),
      //sends the actual data
    })
      .then((response) => response.text())
      .then((data) => {
        setLoginMessage(data);
        if (data === "Login successful") {
          fetchProfile();
        }
      });
  };

  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((response) => response.text())
      .then((data) => setInfo(data));
  }, []);

  //sends a request to localhost:3000 and saves the response in React state

  return (
    <>
      <h1>Localist</h1>
      <h3>{info}</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <p>{loginMessage}</p>
      {profile && (
        <div>
          <h2>Your Profile</h2>
          <p>Account type: {profile.account_type}</p>
          <p>Bio: {profile.bio}</p>
          <p>Location: {profile.location}</p>
          <p>Skills: {profile.skills}</p>
        </div>
      )}
    </>
  );
}

export default App;
