import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// ВАЖНО: Добавихме addDoc, doc, getDoc за админ функциите
import { getFirestore, collection, query, where, getDocs, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// URL Параметри
const urlParams = new URLSearchParams(window.location.search);
const muscleId = urlParams.get('muscle');
const muscleName = urlParams.get('name'); // Взимаме името от URL (напр. "Гърди")

// Пагинация
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let allExercises = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!muscleId) {
        window.location.href = 'index.html';
        return;
    }
    // Декодираме името (защото в URL е със странни символи ако е на кирилица)
    document.getElementById('muscle-title').innerText = `Упражнения за: ${muscleName || muscleId}`;
    
    await fetchAndRenderExercises();
});

// --- ЛОГИКА ЗА ПОКАЗВАНЕ ---
async function fetchAndRenderExercises() {
    const list = document.getElementById('exercises-list');
    list.innerHTML = "<p style='text-align:center; color:#94a3b8;'>Зареждане...</p>";

    try {
        // Подреждаме ги по дата (най-новите най-горе), ако има поле createdAt.
        // Ако нямаш индекси, може да даде грешка, затова засега ползваме само where
        const q = query(collection(db, "exercises"), where("muscleId", "==", muscleId));
        const querySnapshot = await getDocs(q);

        allExercises = [];
        querySnapshot.forEach((doc) => {
            allExercises.push(doc.data());
        });

        // Сортираме ръчно по име (по желание)
        // allExercises.sort((a, b) => a.name.localeCompare(b.name));

        if (allExercises.length === 0) {
            list.innerHTML = "<p style='text-align:center;'>Няма упражнения за тази група.</p>";
            updatePaginationControls();
            return;
        }

        renderPage(1);

    } catch (error) {
        console.error("Error:", error);
        list.innerHTML = "<p>Грешка при зареждане.</p>";
    }
}

function renderPage(page) {
    currentPage = page;
    const list = document.getElementById('exercises-list');
    list.innerHTML = "";
    
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const exercisesToShow = allExercises.slice(start, end);

    exercisesToShow.forEach(data => {
        let mediaHTML = '';
        if (data.imageUrl) {
            mediaHTML += `<img src="${data.imageUrl}" style="max-height: 300px; display:block; margin: 0 auto 10px auto; border-radius: 8px;">`;
        }
        if (data.videoUrl) {
            const embedLink = getYouTubeEmbedLink(data.videoUrl);
            if (embedLink) {
                mediaHTML += `
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius:8px; margin-top:10px;">
                        <iframe src="${embedLink}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
                    </div>
                `;
            }
        }

        const card = `
            <div class="exercise-card">
                <h3 style="color:white; margin-bottom:10px;">${data.name}</h3>
                ${mediaHTML}
                <p style="color:#cbd5e1; margin-top:10px;">${data.description}</p>
            </div>
        `;
        list.innerHTML += card;
    });
    
    window.scrollTo(0, 0);
    updatePaginationControls();
}

function updatePaginationControls() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const info = document.getElementById('page-info');

    const totalPages = Math.ceil(allExercises.length / ITEMS_PER_PAGE);
    info.innerText = `Страница ${currentPage} от ${totalPages || 1}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) renderPage(currentPage - 1);
});
document.getElementById('next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(allExercises.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) renderPage(currentPage + 1);
});

function getYouTubeEmbedLink(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}

// --- АДМИН ЛОГИКА (Записване) ---
const saveBtn = document.getElementById('save-new-ex-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('new-ex-name').value;
        const img = document.getElementById('new-ex-img').value;
        const video = document.getElementById('new-ex-video').value;
        const desc = document.getElementById('new-ex-desc').value;

        if (!name || !desc) {
            alert("Моля попълнете име и описание!");
            return;
        }

        try {
            await addDoc(collection(db, "exercises"), {
                name: name,
                description: desc,
                imageUrl: img,
                videoUrl: video,
                muscleId: muscleId, // Взимаме ID-то директно от URL-а на страницата!
                createdAt: new Date()
            });

            alert("Успешно добавено!");
            // Изчистване
            document.getElementById('new-ex-name').value = "";
            document.getElementById('new-ex-img').value = "";
            document.getElementById('new-ex-video').value = "";
            document.getElementById('new-ex-desc').value = "";
            
            // Презареждаме списъка
            fetchAndRenderExercises();

        } catch (e) {
            console.error("Error saving:", e);
            alert("Грешка при запис.");
        }
    });
}

// --- AUTH (Навигация + Админ проверка) ---
onAuthStateChanged(auth, async (user) => {
    const loginLi = document.getElementById('login-li');
    const logoutLi = document.getElementById('logout-li');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    const adminBox = document.getElementById('admin-add-box');

    if (user) {
        if(loginLi) loginLi.style.display = 'none';
        if(logoutLi) logoutLi.style.display = 'block';
        if(userDisplay) {
            userDisplay.style.display = 'block';
            userDisplay.innerText = user.email.split('@')[0];
        }

        // ПРОВЕРКА ЗА АДМИН
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const role = userDoc.data().role;
                if (role === 'admin') {
                    // Ако е админ, показваме формата
                    if(adminBox) adminBox.style.display = 'block';
                }
            }
        } catch (e) {
            console.error("Error checking role:", e);
        }

        if(logoutBtn) {
            logoutBtn.onclick = () => {
                signOut(auth).then(() => window.location.reload());
            };
        }
    } else {
        if(loginLi) loginLi.style.display = 'block';
        if(logoutLi) logoutLi.style.display = 'none';
        if(adminBox) adminBox.style.display = 'none';
    }
});