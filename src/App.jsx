import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Medal, Star, CheckCircle, Crown, Save, Share2, Award, Zap, Calendar, XCircle, Instagram, PauseCircle, Link as LinkIcon, ArrowLeft, Users, LayoutDashboard, Lock } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
// ⚠️ IMPORTANT: Paste your REAL keys here again!
const firebaseConfig = {
  apiKey: "AIzaSyAi9u70r8VUoKAjRIH_5rFL6DCo6wCgaok",
  authDomain: "final-30-day-dash.firebaseapp.com",
  projectId: "final-30-day-dash",
  storageBucket: "final-30-day-dash.firebasestorage.app",
  messagingSenderId: "492385758592",
  appId: "1:492385758592:web:6bed1da895cb9abbfb6565"
};

// --- App Initialization ---
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase not initialized. Did you paste your keys?");
}

const appId = "30-day-dash-live"; 

const ChallengeTracker = () => {
  // --- Configuration ---
  const TOTAL_DAYS = 30;
  const ADMIN_PIN = "26102004"; 
  
  // Initial Users
  const INITIAL_USERS = [
    { id: 1, name: "Yash", habits: ["Workout", "Read 10p", "No Sugar"] },
    { id: 2, name: "Akshar", habits: ["Run 5k", "Code 1hr", "Water 2L"] },
    { id: 3, name: "Maadhav", habits: ["Daily workout", "Daily nutritional goal", "4hrs of deep work"] },
    { id: 4, name: "Dev", habits: ["No sugar", "Less than 4 hours phone screen time", "Gym"] },
    { id: 5, name: "Lin", habits: ["Gym", "Protein", "Sleep 8h"] },
    { id: 6, name: "Pritam", habits: ["Write", "Draw", "Clean"] },
    { id: 7, name: "Megan", habits: ["Gym", "3hrs of study", "3hrs of sim racing"] },
    { id: 8, name: "Nirav", habits: ["Swim", "Read", "Skin Care"] },
    { id: 9, name: "Daksh", habits: ["No sugar", "Daily reading", "Workout","1 weekly podcast"] },
    { id: 10, name: "Raheel", habits: ["Dance", "Music", "Garden"] },
    { id: 11, name: "Nisha", habits: ["Daily Workout", "Handstand Practice", "No gluten/dairy"] },
    { id: 12, name: "Tirth", habits: ["1.5 hours reading", "Less than 20g sugar", "25 minutes of prayer","Hybrid workout"] },
    { id: 13, name: "Rayan", habits: ["5 hours of study", "30 mins workout daily", "Daily vlog"] },
    { id: 14, name: "Moulik", habits: ["Gym", "Eat a home-cooked dinner", "Watch 2 Marrow Lectures"] },
    { id: 15, name: "Kliz", habits: ["Gym", "Eat a home-cooked dinner", "Daily vlog"] },
  ];

  // --- State ---
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(INITIAL_USERS[0]);
  const [viewMode, setViewMode] = useState('landing'); 
  const [activeTab, setActiveTab] = useState('tracker'); 
  const [trackingData, setTrackingData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [summaryDay, setSummaryDay] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // --- Auth & Data Loading Effects ---
  useEffect(() => {
    const initAuth = async () => {
      if (!auth) return;
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };
    initAuth();

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const docRef = doc(db, 'artifacts', appId, 'users', 'global_group', 'tracker_data', 'dec_2025_official');
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.records) setTrackingData(data.records);
      } else {
        setTrackingData({});
      }
    });
    return () => unsubscribe();
  }, [user]);

  // --- URL Hash Listener ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash; 
      if (hash.includes('user=')) {
        const id = parseInt(hash.split('=')[1]);
        const u = INITIAL_USERS.find(user => user.id === id);
        if (u) {
          setSelectedUser(u);
          setViewMode('personal');
          setShowAdminLogin(false);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- Actions ---
  const toggleHabit = async (userId, day, habitIdx) => {
    const userDays = trackingData[userId] || {};
    const dayHabits = userDays[day] || {};
    const currentVal = dayHabits[habitIdx];

    let nextVal;
    if (currentVal === true) {
      nextVal = 'exempt';
    } else if (currentVal === 'exempt') {
      nextVal = null; 
    } else {
      nextVal = true;
    }

    const newTrackingData = {
      ...trackingData,
      [userId]: {
        ...userDays,
        [day]: { ...dayHabits, [habitIdx]: nextVal }
      }
    };

    setTrackingData(newTrackingData);

    if (user && db) {
      setIsSaving(true);
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', 'global_group', 'tracker_data', 'dec_2025_official');
        await setDoc(docRef, { records: newTrackingData }, { merge: true });
      } catch (err) {
        console.error("Error saving data:", err);
      } finally {
        setTimeout(() => setIsSaving(false), 500);
      }
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setViewMode('dashboard');
      setShowAdminLogin(false);
      setPinInput("");
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  // --- Logic Helper Functions ---
  const getDayStats = (userId, day) => {
    const user = INITIAL_USERS.find(u => u.id === userId);
    const dayData = trackingData[userId]?.[day] || {};
    const habitsDoneCount = Object.values(dayData).filter(v => v === true).length;
    const habitsExemptCount = Object.values(dayData).filter(v => v === 'exempt').length;
    const isSuccessful = (habitsDoneCount + habitsExemptCount) === user.habits.length;
    return { habitsDoneCount, habitsExemptCount, isSuccessful };
  };

  const getStreakData = (userId) => {
    let currentStreak = 0;
    let maxStreak = 0;
    let runningStreak = 0;
    let streaksByDay = {}; 

    for (let day = 1; day <= TOTAL_DAYS; day++) {
      const { isSuccessful } = getDayStats(userId, day);
      if (isSuccessful) {
        runningStreak++;
      } else {
        runningStreak = 0;
      }
      streaksByDay[day] = runningStreak;
      maxStreak = Math.max(maxStreak, runningStreak);
    }
    return { maxStreak, streaksByDay, currentStreak: runningStreak };
  };

  const getBadges = (userId) => {
    const { maxStreak } = getStreakData(userId);
    const badges = [];
    if (maxStreak >= 5) badges.push({ icon: Zap, color: "text-blue-500", label: "5 Day Spark" });
    if (maxStreak >= 10) badges.push({ icon: Medal, color: "text-amber-700", label: "10 Day Bronze" });
    if (maxStreak >= 15) badges.push({ icon: Medal, color: "text-slate-400", label: "15 Day Silver" });
    if (maxStreak >= 20) badges.push({ icon: Star, color: "text-yellow-400", label: "20 Day Gold" });
    if (maxStreak >= 25) badges.push({ icon: Crown, color: "text-purple-500", label: "25 Day Elite" });
    if (maxStreak >= 30) badges.push({ icon: Trophy, color: "text-yellow-500", label: "30 Day Champion" });
    return badges;
  };

  const getWeeklyChamps = () => {
    const weeks = [
      { id: 1, range: [1, 7], label: "Week 1" },
      { id: 2, range: [8, 14], label: "Week 2" },
      { id: 3, range: [15, 21], label: "Week 3" },
      { id: 4, range: [22, 28], label: "Week 4" }, 
    ];

    return weeks.map(week => {
      let bestUser = null;
      let maxSuccesses = -1;
      INITIAL_USERS.forEach(user => {
        let successCount = 0;
        for (let d = week.range[0]; d <= week.range[1]; d++) {
          if (getDayStats(user.id, d).isSuccessful) successCount++;
        }
        if (successCount > maxSuccesses) {
          maxSuccesses = successCount;
          bestUser = user;
        }
      });
      return { ...week, winner: bestUser, score: maxSuccesses };
    });
  };

  // --- View Components ---

  const LandingPage = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 max-w-md w-full">
        <Trophy size={64} className="text-yellow-500 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-indigo-900 mb-2">30 Day Dash</h1>
        <p className="text-gray-500 mb-8">Select your profile to log your daily habits.</p>
        {!auth && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-200">
            ⚠️ Database not connected. Please add your Firebase Keys in the code.
          </div>
        )}
        <div className="space-y-3 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">Participants</p>
          <div className="grid grid-cols-2 gap-2">
            {INITIAL_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setViewMode('personal');
                }}
                className="p-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-gray-100"
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6">
          <button 
            onClick={() => setShowAdminLogin(true)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-200"
          >
            <Lock size={16} />
            Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  const AdminLoginModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock size={18} className="text-indigo-600"/> Admin Access
          </h3>
          <button onClick={() => { setShowAdminLogin(false); setPinError(false); }} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>
        <form onSubmit={handleAdminLogin}>
          <p className="text-sm text-gray-500 mb-4">Enter the admin PIN code to view the dashboard.</p>
          <input 
            autoFocus
            type="password" 
            pattern="[0-9]*" 
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Enter PIN"
            className="w-full text-center text-2xl tracking-widest font-bold border-2 border-indigo-100 rounded-lg py-3 focus:border-indigo-500 focus:outline-none mb-4"
          />
          {pinError && <p className="text-red-500 text-sm text-center font-bold mb-4">Incorrect PIN</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Unlock</button>
        </form>
      </div>
    </div>
  );

  const ShareLinksModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Personal Logging Links</h3>
          <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Send these links to your friends. They will take them directly to their personal logging sheet.
        </p>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {INITIAL_USERS.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="font-semibold text-gray-700">{u.name}</span>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}#user=${u.id}`;
                  navigator.clipboard.writeText(url);
                }}
                className="text-xs bg-white border border-gray-200 text-indigo-600 px-3 py-1.5 rounded-md hover:bg-indigo-50 font-medium active:scale-95 transition-transform"
              >
                Copy Link
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const UserSelector = () => (
    <div className="flex overflow-x-auto pb-4 gap-2 mb-6 border-b border-indigo-100 hide-scrollbar">
      {INITIAL_USERS.map(user => (
        <button
          key={user.id}
          onClick={() => setSelectedUser(user)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
            selectedUser.id === user.id
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-indigo-200"
              : "bg-white text-gray-600 border border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          {user.name}
        </button>
      ))}
    </div>
  );

  const TrackerTable = () => {
    const { streaksByDay } = getStreakData(selectedUser.id);
    return (
      <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-indigo-900">{selectedUser.name}'s Tracker</h2>
            <p className="text-sm text-indigo-600">Click once for Done, again for Skip/Rest (keeps streak).</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {getBadges(selectedUser.id).map((badge, idx) => (
              <div key={idx} className={`p-2 bg-white border border-indigo-100 shadow-sm rounded-full ${badge.color}`} title={badge.label}><badge.icon size={20} /></div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-indigo-50/50 text-indigo-900 text-sm uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold border-b border-indigo-100">Day</th>
                <th className="px-6 py-3 font-semibold border-b border-indigo-100">Habits</th>
                <th className="px-6 py-3 font-semibold border-b border-indigo-100 text-center">Score</th>
                <th className="px-6 py-3 font-semibold border-b border-indigo-100 text-center">Status</th>
                <th className="px-6 py-3 font-semibold border-b border-indigo-100 text-center">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(day => {
                const { habitsDoneCount, habitsExemptCount, isSuccessful } = getDayStats(selectedUser.id, day);
                const streak = streaksByDay[day];
                return (
                  <tr key={day} className={`hover:bg-indigo-50/50 transition-colors ${isSuccessful ? 'bg-green-50/40' : ''}`}>
                    <td className="px-6 py-3 font-medium text-gray-900 w-24">Day {day}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-4 flex-wrap">
                        {selectedUser.habits.map((habit, idx) => {
                          const status = trackingData[selectedUser.id]?.[day]?.[idx]; 
                          let btnClass = "bg-white border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-400";
                          let icon = null;
                          let borderClass = "border-gray-300";
                          if (status === true) {
                            btnClass = "bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-200 text-emerald-800";
                            borderClass = "bg-emerald-500 border-emerald-500";
                            icon = <CheckCircle size={12} className="text-white" />;
                          } else if (status === 'exempt') {
                            btnClass = "bg-gray-100 border-gray-200 text-gray-500";
                            borderClass = "bg-gray-400 border-gray-400";
                            icon = <PauseCircle size={12} className="text-white" />;
                          }
                          return (
                            <button key={idx} onClick={() => toggleHabit(selectedUser.id, day, idx)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all shadow-sm ${btnClass}`}>
                              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${borderClass}`}>{icon}</div>
                              {habit}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`font-mono font-bold ${isSuccessful ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {habitsDoneCount}/{selectedUser.habits.length}
                        {habitsExemptCount > 0 && <span className="text-xs text-gray-500 ml-1">({habitsExemptCount} skip)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {isSuccessful ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Success <CheckCircle size={12} /></span>
                      ) : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-gray-700">
                        {streak > 0 && <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />}
                        <span className={streak > 0 ? "text-orange-600" : "text-gray-400"}>{streak}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // UPDATED Daily Summary Logic to Support Ties
  const DailySummaryView = () => {
    const successfulUsers = INITIAL_USERS.filter(u => getDayStats(u.id, summaryDay).isSuccessful);
    const unsuccessfulUsers = INITIAL_USERS.filter(u => !getDayStats(u.id, summaryDay).isSuccessful);
    
    // Calculate Streak Leaders
    const streakLeaders = INITIAL_USERS.map(u => ({
      ...u,
      currentStreak: getStreakData(u.id).streaksByDay[summaryDay] || 0
    })).sort((a, b) => b.currentStreak - a.currentStreak);

    // Find the Highest Streak Number
    const maxStreakVal = streakLeaders[0]?.currentStreak || 0;

    // Filter to find EVERYONE with that top streak (handling ties)
    const allTopLeaders = streakLeaders.filter(u => u.currentStreak === maxStreakVal && maxStreakVal > 0);

    // Filter for the "Top Streaks" list (everyone with > 0 streak)
    const topStreakLeaders = streakLeaders.filter(u => u.currentStreak > 0).slice(0, 5);

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-gray-700">Daily Summary Generator</h2>
             <div className="flex items-center gap-2">
               <span className="text-sm text-gray-500">Select Day:</span>
               <select value={summaryDay} onChange={(e) => setSummaryDay(Number(e.target.value))} className="bg-indigo-50 border-indigo-200 rounded-md py-1 px-3 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500">
                 {Array.from({length: TOTAL_DAYS}, (_, i) => i + 1).map(d => <option key={d} value={d}>Day {d}</option>)}
               </select>
             </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 md:p-8 rounded-xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={200} /></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200 uppercase italic tracking-wider">Daily Report</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-semibold text-white">Day {summaryDay}</span>
                      <span className="text-indigo-200 text-sm">@yashgrows</span>
                   </div>
                 </div>
                 <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20"><Calendar className="text-white" size={24} /></div>
               </div>
               
               {/* UPDATED: Multiple Leaders Display */}
               <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm">
                 <div className="flex items-center gap-3">
                   <div className="bg-amber-500 text-white p-2 rounded-full shadow-lg shadow-amber-500/50"><Crown size={20} /></div>
                   <div>
                     <p className="text-xs text-amber-200 font-bold uppercase tracking-widest">
                       {allTopLeaders.length > 1 ? "Current Streak Leaders" : "Current Streak Leader"}
                     </p>
                     <p className="text-lg font-bold text-white leading-tight">
                       {allTopLeaders.length > 0 
                         ? allTopLeaders.map(u => u.name).join(", ") 
                         : "None"}
                     </p>
                   </div>
                 </div>
                 <div className="text-2xl font-black text-amber-400 whitespace-nowrap pl-4">
                   {maxStreakVal} <span className="text-sm font-medium text-amber-200/70">DAYS</span>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-emerald-900/30 rounded-lg p-4 backdrop-blur-sm border border-emerald-500/30">
                   <div className="flex items-center gap
