import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../css/Auth.css";

function Home() {
  const [username, setUsername] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    dateOfIssue: "2026-03-20",
    location: "BSIT3E",
    whatILike: "COFFEE",
    memberOf: "정보기술\nInformation Technology",
    profileImage: "/WONN.jpg",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserData = async (username) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${username}`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched user data:", data);
        setUserData({
          name: data.name || username,
          dateOfIssue:
            data.dateOfIssue || new Date().toISOString().split("T")[0],
          location: data.location || "BSIT3E",
          whatILike: data.whatILike || "COFFEE",
          memberOf: data.memberOf || "정보기술\nInformation Technology",
          profileImage: data.profileImage || "/WONN.jpg",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const state = location.state;
    if (state && state.username) {
      setUsername(state.username);
      setUserData((prev) => ({ ...prev, name: state.username }));
      localStorage.setItem(
        "user",
        JSON.stringify({ username: state.username, userId: state.userId }),
      );

      fetchUserData(state.username);

      if (!hasShownWelcome) {
        Swal.fire({
          title: "Welcome to NewJeans!",
          text: `Hello ${state.username}! You are now a certified friend of NewJeans.`,
          icon: "success",
          background: "#ffffff",
          confirmButtonColor: "#8b5cf6",
          confirmButtonText: "Enter the Bunny Den",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: true,
        });
        setHasShownWelcome(true);
      }
    } else {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser && storedUser.username) {
        setUsername(storedUser.username);
        setUserData((prev) => ({ ...prev, name: storedUser.username }));

        fetchUserData(storedUser.username);

        if (!hasShownWelcome) {
          Swal.fire({
            title: "Welcome Back!",
            text: `Nice to see you again, ${storedUser.username}!`,
            icon: "success",
            background: "#ffffff",
            confirmButtonColor: "#8b5cf6",
            confirmButtonText: "Continue",
            timer: 2500,
            timerProgressBar: true,
          });
          setHasShownWelcome(true);
        }
      } else {
        navigate("/");
      }
    }
  }, [location, navigate, hasShownWelcome]);

  const handleLogout = () => {
    Swal.fire({
      title: "Leave?",
      text: "You will be logged out",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("user");
        Swal.fire({
          title: "Goodbye!",
          text: "Come back soon to NewJeans!",
          icon: "info",
          confirmButtonColor: "#8b5cf6",
          timer: 2000,
          showConfirmButton: true,
        }).then(() => {
          navigate("/");
        });
      }
    });
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const idNumber = "10001111";

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="nj-card loading-card">
          <div className="loading-spinner"></div>
          <p>Loading your ID card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <button onClick={handleLogout} className="nj-logout-btn">
        LOG OUT
      </button>

   

      <div
        className={`flip-card ${isFlipped ? "flipped" : ""}`}
        onClick={handleCardClick}
      >
        <div className="flip-card-inner">
          {/* FRONT */}
          <div className="flip-card-front">
            <div className="nj-card">
              <div className="nj-top">
                <h1 className="nj-team">
                  <span className="highlight">Team</span>NewJeans
                </h1>
                <div className="nj-id">
                  <p>IDENTIFICATION CARD</p>
                  <span>NO.{idNumber}</span>
                </div>
              </div>

              <div className="nj-body">
                <div className="nj-left">
                  <img
                    src={userData.profileImage}
                    alt={userData.name || username}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/WONN.jpg";
                    }}
                  />
                </div>

                <div className="nj-right">
                  <div className="row">
                    <span>유저네임/UserName</span>
                    <b>★{userData.name || username || "pip"}★</b>
                  </div>

                  <div className="row">
                    <span>발급일/Date of Issue</span>
                    <b>{userData.dateOfIssue}</b>
                  </div>

                  <div className="row">
                    <span>섹션/Section</span> <b>{userData.location}</b>
                  </div>

                  <div className="row">
                    <span>좋아하는 것/What I like</span>
                    <b>{userData.whatILike}</b>
                  </div>

                  <div className="row">
                    <span>소속 클럽/Member of</span>
                    <b style={{ whiteSpace: "pre-line" }}>
                      {userData.memberOf}
                    </b>
                  </div>

                  <p className="nj-desc">
                    이 카드를 소지한 사람은 NewJeans의 친구임을 증명합니다.
                    <br />
                    This card certifies the bearer as a friend of NewJeans.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className="flip-card-back">
            <div className="back-card">
              <div className="nj-top">
                <h1 className="nj-team">
                  <span className="highlight">Bunny</span>Pass
                </h1>
                <div className="nj-id">
                  <p>MEMBERSHIP CARD</p>
                  <span>NO.{idNumber}</span>
                </div>
              </div>

              <div className="nj-body">
                <div className="nj-left">
                  <img
                    src={userData.profileImage}
                    alt={userData.name || username}
                    className="back-card-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/WONN.jpg";
                    }}
                  />
                </div>

                <div className="nj-right">
                  <div className="row">
                    <span>멤버십/Membership</span>
                    <b>★ VIP ★</b>
                  </div>

                  <div className="row">
                    <span>가입일/Join Date</span>
                    <b>{userData.dateOfIssue}</b>
                  </div>

                  <div className="row">
                    <span>포인트/Points</span>
                    <b>SIX SEVENNN</b>
                  </div>

                  <div className="row">
                    <span>좋아하는 노래/Fav Song</span>
                    <b>Attention • Ditto • OMG</b>
                  </div>

                  <div className="row">
                    <span>팬클럽/Fan Club</span>
                    <b>Bunnies ₍ᐢ.ˬ.ᐢ₎</b>
                  </div>

                  <p className="nj-desc">
                    이 카드는 NewJeans 팬클럽 정회원임을 증명합니다.
                    <br />
                    This card certifies official membership in NewJeans Fan
                    Club.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
