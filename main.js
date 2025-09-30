document.addEventListener('DOMContentLoaded', () => {

  // Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBF5gzPThKD1ga_zpvtdBpiQFsexbEpZyY",
    authDomain: "stockify-75531.firebaseapp.com",
    projectId: "stockify-75531",
    storageBucket: "stockify-75531.firebasestorage.app",
    messagingSenderId: "831334536771",
    appId: "1:831334536771:web:b142abcead4df128c826f6"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Redirect to login if not signed in
  auth.onAuthStateChanged(user => {
    if(!user) window.location.href = 'login.html';
  });

  // Page navigation
  window.showPage = function(pageId){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const page=document.getElementById(pageId);
    if(page) page.classList.add('active');
  };
  document.querySelectorAll('#navbar button[data-page]').forEach(btn=>{
    btn.addEventListener('click',()=>showPage(btn.dataset.page));
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async ()=>{
    await auth.signOut();
    window.location.href = 'login.html';
  });

  // --- Placeholder portfolio logic ---
  let balance=10000;
  let investments={};

  function displayPortfolio(){
    document.getElementById('balance').innerText=`Balance: ${balance} credits`;
    const container=document.getElementById('investments');
    container.innerHTML='';
    const entries=Object.entries(investments);
    if(!entries.length){ container.innerHTML='<div class="card">No investments yet.</div>'; return; }
    entries.forEach(([artist,amt])=>{
      const d=document.createElement('div');
      d.className='investment-item card';
      d.innerHTML=`<div>${artist}</div><div><strong>${amt} credits</strong></div>`;
      container.appendChild(d);
    });
  }

  window.displayPortfolio=displayPortfolio;

});
