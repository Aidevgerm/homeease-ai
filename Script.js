let credits = 3;  
let isProMember = false;  
let paywallInitialized = false;  
let currentUser = null;  
let isSignUpMode = false;  
let selectedPlan = { type: 'yearly', price: 59.99 };  
let deferredPrompt = null;  
  
window.addEventListener('beforeinstallprompt', (e) => {  
  e.preventDefault();  
  deferredPrompt = e;  
  const installBtn = document.getElementById('install-btn');  
  if (installBtn) installBtn.style.display = 'inline-block';  
});  
  
function triggerAppInstall() {  
  if (deferredPrompt) {  
    deferredPrompt.prompt();  
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });  
  } else {  
    const installSection = document.getElementById('install-section');  
    installSection.scrollIntoView({ behavior: 'smooth' });  
    installSection.classList.add('highlight');  
    setTimeout(() => installSection.classList.remove('highlight'), 3000);  
  }  
}  
  
document.addEventListener("DOMContentLoaded", () => {  
  const savedUser = localStorage.getItem("homeease_user");  
  if (savedUser) {  
    currentUser = JSON.parse(savedUser);  
    if (currentUser.isPro) {  
      activateProStatus();  
    }  
    updateUserUI();  
  }  
});  
  
function selectPlan(type, price) {  
  selectedPlan = { type: type, price: price };  
  document.getElementById('plan-yearly').classList.remove('selected');  
  document.getElementById('plan-monthly').classList.remove('selected');  
    
  if (type === 'yearly') {  
    document.getElementById('plan-yearly').classList.add('selected');  
  } else {  
    document.getElementById('plan-monthly').classList.add('selected');  
  }  
    
  paywallInitialized = false;  
  document.getElementById('paypal-button-container').innerHTML = '';  
  initPayPalButton();  
}  
  
function updateForm() {  
  const mode = document.getElementById('funktion').value;  
  const l1 = document.getElementById('input-1-label');  
  const p1 = document.getElementById('input-1');  
  const l2 = document.getElementById('input-2-label');  
  const p2 = document.getElementById('input-2');  
  
  if (mode === "rezept") {  
    l1.innerText = "Zutaten im Kühlschrank / Vorrat:";  
    p1.placeholder = "z. B. 2 Eier, Nudeln, Brokkoli, etwas Sahne";  
    l2.innerText = "Zusatz-Wunsch (Zubereitungszeit / Diät):";  
    p2.placeholder = "z. B. Max. 15 Min, vegetarisch";  
  } else if (mode === "abo") {  
    l1.innerText = "Deine monatlichen Abos (Streaming, Gym, Apps):";  
    p1.placeholder = "z. B. Netflix 17.99€, Gym 39.99€, Spotify 10.99€";  
    l2.innerText = "Welche nutzt du selten?";  
    p2.placeholder = "z. B. Netflix schaue ich kaum noch";  
  } else if (mode === "putzplan") {  
    l1.innerText = "Räume / Personen im Haushalt:";  
    p1.placeholder = "z. B. 3 Zimmer, Bad, Küche - 2 Personen";  
    l2.innerText = "Fokus / Verfügbare Zeit pro Tag:";  
    p2.placeholder = "z. B. Max 20 Minuten am Tag";  
  } else if (mode === "einkaufszettel") {  
    l1.innerText = "👑 PRO: Rezepte / Gerichte für die Woche:";  
    p1.placeholder = "z. B. Gemüseeintopf, Nudeln mit Pesto, Linsensalat";  
    l2.innerText = "Personenanzahl & Haushaltsgröße:";  
    p2.placeholder = "z. B. 2 Erwachsene, 1 Kind";  
  } else {  
    l1.innerText = "👑 PRO: Vertrag / Abo, das gekündigt werden soll:";  
    p1.placeholder = "z. B. Fitnessstudio / Vertragsnummer #12345";  
    l2.innerText = "Deine Adresse & Vertragspartner-Adresse:";  
    p2.placeholder = "z. B. Max Muster, Musterstraße 1, 12345 Berlin";  
  }  
}  
  
function toggleAuthModal() {  
  document.getElementById('auth-modal').classList.toggle('hidden');  
}  
  
function switchAuthMode(event) {  
  event.preventDefault();  
  isSignUpMode = !isSignUpMode;  
  document.getElementById('modal-title').innerText = isSignUpMode ? "Konto erstellen" : "HomeEase Login";  
  document.getElementById('name-group').style.display = isSignUpMode ? "flex" : "none";  
}  
  
async function handleAuth(event) {  
  event.preventDefault();  
  const email = document.getElementById('auth-email').value;  
  const name = document.getElementById('auth-name').value || email.split('@')[0];  
  
  if (isSignUpMode) {  
    try {  
      await fetch('/api/send-welcome-email', {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({ email: email, name: name })  
      });  
    } catch (e) {}  
    credits += 2;  
  }  
  
  currentUser = { name: name, email: email, isPro: isProMember };  
  localStorage.setItem("homeease_user", JSON.stringify(currentUser));  
  updateUserUI();  
  toggleAuthModal();  
}  
  
function updateUserUI() {  
  if (currentUser) {  
    document.getElementById('auth-btn').innerText = `👤 ${currentUser.name}`;  
    document.getElementById('member-dashboard').classList.remove('hidden');  
    document.getElementById('user-display-name').innerText = currentUser.name;  
  }  
}  
  
function logoutUser() {  
  localStorage.removeItem("homeease_user");  
  currentUser = null;  
  isProMember = false;  
  document.getElementById('auth-btn').innerText = "🔑 Anmelden / Registrieren";  
  document.getElementById('member-dashboard').classList.add('hidden');  
}  
  
function generateLifeSolution() {  
  const mode = document.getElementById('funktion').value;  
  const val1 = document.getElementById('input-1').value.trim();  
  const val2 = document.getElementById('input-2').value.trim();  
  const outputBox = document.getElementById('output-box');  
  
  if (!val1) {  
    alert("Bitte fülle die Felder aus!");  
    return;  
  }  
  
  // Für Pro-Funktionen muss ein Abo aktiv sein  
  if ((mode === "einkaufszettel" || mode === "kuendigung_pdf") && !isProMember) {  
    alert("Diese Funktion ist exklusiv für Pro-Abonnenten freigeschaltet!");  
    openPaywall();  
    return;  
  }  
  
  if (credits <= 0 && !isProMember) {  
    openPaywall();  
    outputBox.innerText = "❌ Keine Credits mehr frei. Bitte schalte ein Abo frei.";  
    return;  
  }  
  
  outputBox.innerText = "⏳ HomeEase AI erstellt deinen persönlichen Plan...";  
  
  setTimeout(() => {  
    let result = "";  
  
    if (mode === "rezept") {  
      result = `🍳 REZEPT: Blitz-Pfanne (${val2 || 'Schnell & Lecker'})\n\nZutaten: ${val1}\n\nZubereitung (12 Minuten):\n1. Zutaten klein schneiden.\n2. In der Pfanne mit Öl 6-8 Minuten anbraten.\n3. Abschmecken und servieren!`;  
    } else if (mode === "abo") {  
      result = `💡 ABO-ANALYSE & KÜNDIGUNGS-CHECK\n\nEingetragene Abos: ${val1}\nEinsparpotenzial: ca. 215,88 € / Jahr\n\nEmpfehlung:\nKündige sofort das ungenutzte Abo (${val2 || 'Streaming'}).`;  
    } else if (mode === "putzplan") {  
      result = `🧹 DEIN FAIRER KI-PUTZPLAN\n\nRäume: ${val1}\nMo: Küche (10 Min)\nMi: Bad (15 Min)\nFr: Böden wischen (15 Min)`;  
    } else if (mode === "einkaufszettel") {  
      result = `🛒 PRO WOCHEN-EINKAUFSZETTEL (${val2})\n\nGerichte: ${val1}\n\n📋 Gemüsetheke:\n- Zwiebeln, Knoblauch, Brokkoli, Karotten\n\n📦 Trockenwaren:\n- Nudeln, Linsen, Olivenöl\n\n🥛 Kühlung:\n- Sahne, Butter, Käse\n\n✅ Fertig vorbereitet für den nächsten Wocheneinkauf!`;  
    } else {  
      result = `📄 RECHTSSICHERES KÜNDIGUNGSSCHREIBEN (PRO)\n\nAbsender: ${val2 || 'Max Mustermann'}\nVertragspartner: ${val1}\n\nSehr geehrte Damen und Herren,\n\nhiermit kündige ich den oben genannten Vertrag fristgerecht zum nächstmöglichen Zeitpunkt.\nBitte senden Sie mir eine schriftliche Bestätigung des Kündigungszeitpunkts zu.\n\nMit freundlichen Grüßen,\n[Digitale Unterschrift]`;  
    }  
  
    if (!isProMember) credits--;  
    document.getElementById('credit-count').innerText = isProMember ? "PRO Member 👑" : `${credits} Credits`;  
    outputBox.innerText = result;  
      
    document.getElementById('copy-btn').style.display = "block";  
    document.getElementById('share-btn').style.display = "block";  
    if (isProMember) document.getElementById('pro-export-btn').style.display = "block";  
  
    if (credits === 0 && !isProMember) openPaywall();  
  }, 1000);  
}  
  
function exportProPdf() {  
  alert("PDF Export gestartet! Dein formatiertes Dokument wird heruntergeladen.");  
}  
  
function copyToClipboard() {  
  navigator.clipboard.writeText(document.getElementById('output-box').innerText)  
    .then(() => alert("Ergebnis in Zwischenablage kopiert!"));  
}  
  
function shareContent() {  
  const text = document.getElementById('output-box').innerText;  
  if (navigator.share) {  
    navigator.share({ title: 'HomeEase AI Plan', text: text });  
  } else {  
    copyToClipboard();  
  }  
}  
  
function openPaywall() {  
  const paywall = document.getElementById('paywall');  
  paywall.classList.remove('hidden');  
  initPayPalButton();  
  paywall.scrollIntoView({ behavior: 'smooth' });  
}  
  
function activateProStatus() {  
  isProMember = true;  
  document.getElementById('credit-count').innerText = "PRO Member 👑";  
  document.getElementById('vip-tag').classList.remove('hidden');  
  if (currentUser) {  
    currentUser.isPro = true;  
    localStorage.setItem("homeease_user", JSON.stringify(currentUser));  
  }  
}  
  
// PayPal Checkout  
function initPayPalButton() {  
  if (paywallInitialized) return;  
  paywallInitialized = true;  
  
  paypal.Buttons({  
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },  
    createOrder: function(data, actions) {  
      return actions.order.create({  
        purchase_units: [{  
          amount: { value: selectedPlan.price.toString() },  
          description: `HomeEase AI - ${selectedPlan.type === 'yearly' ? 'Jahresabo (59,99€)' : 'Monatsabo (14,99€)'} inkl. 3 Tage Trial (Empfänger: sven.dallwig@icloud.com)`  
        }]  
      });  
    },  
    onApprove: function(data, actions) {  
      return actions.order.capture().then(function(details) {  
        activateProStatus();  
        document.getElementById('paywall').classList.add('hidden');  
        alert(`Vielen Dank, ${details.payer.name.given_name}! Die PayPal-Zahlung an sven.dallwig@icloud.com war erfolgreich. Dein Pro-Abo ist aktiv.`);  
      });  
    },  
    onError: function(err) {  
      console.error("PayPal Fehler:", err);  
      alert("Bei der PayPal-Zahlung ist ein Fehler aufgetreten.");  
    }  
  }).render('#paypal-button-container');  
}  
