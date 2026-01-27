// WorkoutsScript.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- ТВОЯТА КОНФИГУРАЦИЯ ---
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

// --- 1. ДЕФИНИЦИЯ НА ПРОГРАМИТЕ (SPLITS) ---
// Тук описваме правилата: Коя програма кои дни има и кои мускули тренира.
const SPLIT_DEFINITIONS = {
    'ppl': [
        { name: "Бутащи (Push)", muscles: ['chest', 'shoulders', 'triceps'] },
        { name: "Дърпащи (Pull)", muscles: ['lats', 'traps', 'biceps', 'forearms'] },
        { name: "Крака (Legs)", muscles: ['quads', 'hamstrings', 'calves', 'glutes'] },
        { name: "Почивка", muscles: [] }
    ],
    'upper_lower': [
        { name: "Горна част А", muscles: ['chest', 'lats', 'shoulders', 'biceps', 'triceps'] },
        { name: "Долна част А", muscles: ['quads', 'hamstrings', 'calves', 'abs'] },
        { name: "Почивка", muscles: [] },
        { name: "Горна част Б", muscles: ['chest', 'traps', 'shoulders', 'forearms'] },
        { name: "Долна част Б", muscles: ['glutes', 'quads', 'lowerback'] }
    ],
    'bro_split': [
        { name: "Понеделник: Гърди", muscles: ['chest'] },
        { name: "Вторник: Гръб", muscles: ['lats', 'traps', 'lowerback'] },
        { name: "Сряда: Рамене", muscles: ['shoulders', 'rear-shoulders'] },
        { name: "Четвъртък: Крака", muscles: ['quads', 'hamstrings', 'calves', 'glutes'] },
        { name: "Петък: Ръце", muscles: ['biceps', 'triceps', 'forearms'] }
    ],
    'full_body': [
        { name: "Цяло тяло А", muscles: ['chest', 'lats', 'quads', 'shoulders', 'abs'] },
        { name: "Почивка", muscles: [] },
        { name: "Цяло тяло Б", muscles: ['hamstrings', 'glutes', 'lowerback', 'biceps', 'triceps'] },
        { name: "Почивка", muscles: [] }
    ]
};

// --- 2. ГЕНЕРИРАНЕ НА ТРЕНИРОВКА ---
window.generateSplit = async (splitType) => {
    const loading = document.getElementById('loading');
    const resultContainer = document.getElementById('workout-result');
    
    loading.style.display = 'block';
    resultContainer.innerHTML = '';

    const routine = SPLIT_DEFINITIONS[splitType];
    
    if (!routine) return;

    // Минаваме през всеки ден от програмата
    for (let day of routine) {
        if (day.muscles.length === 0) {
            // Почивен ден
            resultContainer.innerHTML += createDayCard(day.name, []);
            continue;
        }

        // За всеки мускул в този ден, теглим упражнения
        let dayExercises = [];
        
        // Използваме Promise.all за да изтеглим упражненията за всички мускули паралелно (по-бързо)
        await Promise.all(day.muscles.map(async (muscleId) => {
            const exercises = await getExercisesFromDB(muscleId);
            
            // Взимаме 2 случайни упражнения за този мускул
            const selected = getRandomItems(exercises, 2);
            dayExercises = [...dayExercises, ...selected];
        }));

        resultContainer.innerHTML += createDayCard(day.name, dayExercises);
    }

    loading.style.display = 'none';
};

// --- 3. ТЕГЛЕНЕ ОТ FIREBASE ---
// Кеширане (за да не правим заявки всеки път, ако вече сме изтеглили мускула)
const exercisesCache = {};

async function getExercisesFromDB(muscleId) {
    // Ако вече ги имаме в паметта, връщаме ги директно
    if (exercisesCache[muscleId]) {
        return exercisesCache[muscleId];
    }

    // Ако не, правим заявка към Firebase
    const q = query(collection(db, "exercises"), where("muscleId", "==", muscleId));
    const querySnapshot = await getDocs(q);
    
    const exercises = [];
    querySnapshot.forEach((doc) => {
        exercises.push(doc.data());
    });

    // Запазваме в кеша
    exercisesCache[muscleId] = exercises;
    return exercises;
}

// --- 4. ПОМОЩНИ ФУНКЦИИ ---

// Създаване на HTML карта за деня
function createDayCard(dayName, exercises) {
    let exercisesHTML = '';

    if (exercises.length === 0) {
        exercisesHTML = '<p style="color:#cbd5e1; font-style:italic;">Active Rest / Cardio</p>';
    } else {
        exercises.forEach(ex => {
            exercisesHTML += `
                <div class="exercise-item">
                    <h4>${ex.name}</h4>
                    <p>3 sets x 10-12 reps</p>
                </div>
            `;
        });
    }

    return `
        <div class="workout-day-card">
            <div class="day-header">${dayName}</div>
            <div class="day-exercises">
                ${exercisesHTML}
            </div>
        </div>
    `;
}

// Функция за взимане на случайни елементи от масив
function getRandomItems(arr, count) {
    // Разбъркване на масива
    const shuffled = arr.sort(() => 0.5 - Math.random());
    // Връщане на първите 'count' елемента
    return shuffled.slice(0, count);
}

// --- 5. AUTH LOGIC (За навигацията) ---
// ... (Твоите import-и и SPLIT_DEFINITIONS са горе) ...

// --- AUTH LOGIC (Копирай това за всяка страница) ---
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
        
        // Логика за бутона изход
        if(logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    alert("Logged out!");
                    window.location.reload();
                });
            });
        }
    } else {
        // Гост
        if(loginLi) loginLi.style.display = 'block';
        if(logoutLi) logoutLi.style.display = 'none';
        if(userDisplay) userDisplay.style.display = 'none';
    }
});