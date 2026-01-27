// ToolsScript.js

// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. Firebase Configuration (Сложи твоите данни тук)
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

// 3. Логика за Навигацията (Login/Logout)
onAuthStateChanged(auth, (user) => {
    const loginLi = document.getElementById('login-li');
    const logoutLi = document.getElementById('logout-li');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        // Логнат
        if(loginLi) loginLi.style.display = 'none';
        if(logoutLi) logoutLi.style.display = 'block';
        if(userDisplay) {
            userDisplay.style.display = 'block';
            userDisplay.innerText = user.email.split('@')[0];
        }
        
        // Закачане на Logout събитието
        if(logoutBtn) {
            logoutBtn.onclick = () => {
                signOut(auth).then(() => {
                    alert("Logged out!");
                    window.location.reload();
                });
            };
        }
    } else {
        // Гост
        if(loginLi) loginLi.style.display = 'block';
        if(logoutLi) logoutLi.style.display = 'none';
        if(userDisplay) userDisplay.style.display = 'none';
    }
});

// 4. Логика за Калкулатора
// Използваме 'DOMContentLoaded', за да сме сигурни, че HTML-ът е заредил
document.addEventListener('DOMContentLoaded', () => {
    
    const calorieForm = document.getElementById('calorie-form');

    if (calorieForm) {
        calorieForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Спира презареждането на страницата

            // Взимане на стойностите
            const genderEl = document.querySelector('input[name="gender"]:checked');
            const ageEl = document.getElementById('age');
            const weightEl = document.getElementById('weight');
            const heightEl = document.getElementById('height');
            const activityEl = document.getElementById('activity');

            // Проверка дали елементите съществуват (за да не гърми кодът)
            if(!genderEl || !ageEl || !weightEl || !heightEl || !activityEl) {
                console.error("Missing form elements in HTML");
                return;
            }

            const gender = genderEl.value;
            const age = parseInt(ageEl.value);
            const weight = parseFloat(weightEl.value);
            const height = parseFloat(heightEl.value);
            const activity = parseFloat(activityEl.value);

            // Валидация
            if (!age || !weight || !height) {
                alert("Please fill in all fields correctly.");
                return;
            }

            // Формула на Mifflin-St Jeor
            let bmr;
            if (gender === 'male') {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
            } else {
                bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
            }

            // Изчисляване на TDEE
            const tdee = Math.round(bmr * activity);

            // Показване на резултатите
            const maintainEl = document.getElementById('cal-maintain');
            const cutEl = document.getElementById('cal-cut');
            const bulkEl = document.getElementById('cal-bulk');
            const resultBox = document.getElementById('result-box');

            if(maintainEl) maintainEl.innerText = `${tdee} kcal`;
            if(cutEl) cutEl.innerText = `${tdee - 500} kcal`;
            if(bulkEl) bulkEl.innerText = `${tdee + 500} kcal`;

            // Показване на кутията
            if(resultBox) resultBox.classList.remove('hidden');
        });
    }
});