import { useState, useEffect } from "react";
import "../css/Auth.css";

function Home() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.username) {
      setUsername(storedUser.username);
    }
  }, []);

  return (
    <div className="container">
      <div className="">
        <h1>Welcome, {username || "User"}!</h1>
      </div>
    </div>
  );
}

export default Home;