import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- ТВОЯТА FIREBASE КОНФИГУРАЦИЯ ---
const firebaseConfig = {
    apiKey: "AIzaSyDn3ywqs_Vzf5sbt7KrRvS7i-nHnl2blUQ",
    authDomain: "fitnessbuddy-9e388.firebaseapp.com",
    projectId: "fitnessbuddy-9e388",
    storageBucket: "fitnessbuddy-9e388.firebasestorage.app",
    messagingSenderId: "809386372688",
    appId: "1:809386372688:web:cf8a81e2c4db183be7ab55",
    measurementId: "G-6E3M3NCN6Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Проверка за вход и зареждане на данните
onAuthStateChanged(auth, (user) => {
    const loginLi = document.getElementById('login-li');
    const logoutLi = document.getElementById('logout-li');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Секциите
    const trackerApp = document.getElementById('tracker-app');
    const guestMsg = document.getElementById('guest-msg');

    if (user) {
        // Логнат
        if(loginLi) loginLi.style.display = 'none';
        if(logoutLi) logoutLi.style.display = 'block';
        if(userDisplay) {
            userDisplay.style.display = 'block';
            userDisplay.innerText = user.email.split('@')[0];
        }
        
        // Показваме приложението
        trackerApp.style.display = 'block';
        guestMsg.style.display = 'none';

        // Зареждаме данните за ТОЗИ потребител
        loadUserProgress(user.uid);

        // Логаут
        if(logoutBtn) {
            logoutBtn.onclick = () => {
                signOut(auth).then(() => window.location.reload());
            };
        }
    } else {
        // Гост
        if(loginLi) loginLi.style.display = 'block';
        if(logoutLi) logoutLi.style.display = 'none';
        trackerApp.style.display = 'none';
        guestMsg.style.display = 'block';
    }
});

// --- ДОБАВЯНЕ НА ЗАПИС ---
const addBtn = document.getElementById('add-progress-btn');

addBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("Моля влезте в профила си!");

    const name = document.getElementById('p-name').value;
    const weight = document.getElementById('p-weight').value;
    const sets = document.getElementById('p-sets').value;
    const reps = document.getElementById('p-reps').value;

    if (!name || !weight || !sets || !reps) {
        return alert("Моля попълнете всички полета!");
    }

    try {
        await addDoc(collection(db, "progress_logs"), {
            userId: user.uid, // ВАЖНО: Свързваме записа с потребителя
            exercise: name,
            weight: Number(weight),
            sets: Number(sets),
            reps: Number(reps),
            date: new Date() // Запазваме текущата дата
        });

        // Изчистване
        document.getElementById('p-name').value = "";
        document.getElementById('p-weight').value = "";
        document.getElementById('p-sets').value = "";
        document.getElementById('p-reps').value = "";

    } catch (e) {
        console.error("Error adding log: ", e);
        alert("Грешка при запис.");
    }
});

// --- ЗАРЕЖДАНЕ НА ДАННИ (REAL-TIME) ---
function loadUserProgress(userId) {
    const historyList = document.getElementById('history-list');
    
    // Правим заявка: Дай ми записите, където userId е моето, подредени по дата (най-новите горе)
    const q = query(
        collection(db, "progress_logs"), 
        where("userId", "==", userId),
        orderBy("date", "desc")
    );

    // onSnapshot слуша за промени в реално време (ако добавиш нещо, веднага излиза)
    onSnapshot(q, (snapshot) => {
        historyList.innerHTML = ""; // Чистим старото

        if (snapshot.empty) {
            historyList.innerHTML = "<p>Няма записани тренировки.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.date.toDate().toLocaleDateString("bg-BG"); // Форматираме датата на БГ
            
            const item = `
                <div class="history-item">
                    <div class="history-info">
                        <strong>${data.exercise}</strong>
                        <div class="history-stats">
                            ${data.weight}кг • ${data.sets} серии • ${data.reps} повторения
                        </div>
                        <span class="history-date">${date}</span>
                    </div>
                    <button class="delete-btn" onclick="deleteLog('${doc.id}')">Изтрий</button>
                </div>
            `;
            historyList.innerHTML += item;
        });
    });
}

// Глобална функция за изтриване (за да може да се вика от HTML-а)
window.deleteLog = async (docId) => {
    if(confirm("Сигурни ли сте, че искате да изтриете този запис?")) {
        try {
            await deleteDoc(doc(db, "progress_logs", docId));
        } catch(e) {
            console.error("Error deleting:", e);
        }
    }
};