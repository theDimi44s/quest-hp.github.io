let questions = [];
let counts = { A: 0, B: 0, C: 0, D: 0 };
const houses = {
    A: { name: 'Грифіндор', bg: 'https://contentful.harrypotter.com/usf1vwtuqyxm/3jNnOr6Nfyg6SqmS44CcGi/05b5a62eb3a5d4ea8e50de2918f89b4a/GryffindorCommonRoom_WB_F5_CelebrationInCommonRoom_Promo_080615_Land.jpg', logo: 'https://www.seekpng.com/png/full/826-8266859_gryffindor-crest-transparent-harry-potter-gryffindor-logo-png.png', audio: 'assets/audio/gryffindor.mp3' },
    B: { name: 'Слизерин', bg: 'https://wallpapers.com/images/featured/slytherin-common-room-2ssg552t0qzmp5dd.jpg', logo: 'https://www.seekpng.com/png/full/826-8267044_slytherin-crest-transparent-harry-potter-slytherin-logo-png.png', audio: 'assets/audio/slytherin.mp3' },
    C: { name: 'Гафелпаф', bg: 'https://i.pinimg.com/736x/fc/a4/e7/fca4e7f8bdacfd92efe9f314935b9915.jpg', logo: 'https://www.seekpng.com/png/full/826-8266903_hufflepuff-crest-transparent-harry-potter-hufflepuff-logo-png.png', audio: 'assets/audio/hufflepuff.mp3' },
    D: { name: 'Рейвенкло', bg: 'https://external-preview.redd.it/AXobbNTrBNqjsfk12Ch8elzx2Q6gx4ejtsOC14ilRJY.jpg?auto=webp&s=a7a95fc0b4c3511733b75126b8b4a2de345026a9', logo: 'https://www.seekpng.com/png/full/826-8266952_ravenclaw-crest-transparent-harry-potter-ravenclaw-logo-png.png', audio: 'assets/audio/ravenclaw.mp3' }
};

function startQuiz() {
    localStorage.setItem('counts', JSON.stringify(counts));
    window.location.href = 'question1.html';
}

async function loadQuestions() {
    try {
        const response = await fetch('assets/jsn/questions.json');
        const data = await response.json();
        questions = data.questions;
    } catch (error) {
        console.error('Error loading questions:', error);
    }
}

async function loadQuestion(page) {
    await loadQuestions();
    if (questions.length > 0) {
        const q = questions[page - 1];
        document.getElementById('question-title').innerText = q.text;
        const optionsDiv = document.getElementById('options');
        for (let key in q.options) {
            const btn = document.createElement('button');
            btn.innerText = q.options[key];
            btn.onclick = () => saveAnswer(key, page);
            optionsDiv.appendChild(btn);
        }
    } else {
        console.error('No questions loaded');
    }
}

function saveAnswer(choice, page) {
    counts = JSON.parse(localStorage.getItem('counts')) || counts;
    counts[choice]++;
    localStorage.setItem('counts', JSON.stringify(counts));
    if (page < 10) {
        window.location.href = `question${page + 1}.html`;
    } else {
        window.location.href = 'result.html';
    }
}

function showResult() {
    counts = JSON.parse(localStorage.getItem('counts'));
    let max = 0;
    let houseKey = 'A';
    for (let key in counts) {
        if (counts[key] > max) {
            max = counts[key];
            houseKey = key;
        }
    }
    const house = houses[houseKey];
    document.body.style.backgroundImage = `url(${house.bg})`;
    document.getElementById('house-logo').src = house.logo;
    document.getElementById('result-text').innerText = `Вітаємо! Ти належиш до факультету ${house.name}!`;
    const audio = document.getElementById('house-audio');
    audio.src = house.audio;
    audio.play();
}