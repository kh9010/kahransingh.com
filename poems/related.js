// Poem theme data — maps each poem to its themes and related poems
const poemData = {
    'have-you-ever-seen': { themes: ['nature', 'wonder'], title: 'Have you ever seen' },
    'an-ode-to-aspens': { themes: ['nature', 'mortality'], title: 'An ode to aspens' },
    'kashmir': { themes: ['place', 'wonder'], title: 'Kashmir' },
    'there-comes-a-point': { themes: ['mortality'], title: 'There comes a point one chooses death' },
    'when-you-watch-the-whales-from-shore': { themes: ['nature', 'wonder'], title: 'When you watch the whales from shore' },
    'memories-of-tomorrow': { themes: ['mortality'], title: 'Memories of tomorrow' },
    'delicate-pieces-before-the-end': { themes: ['identity'], title: 'Delicate pieces before the end' },
    'when-im-not-here': { themes: ['love'], title: "When I'm not here" },
    'the-mist': { themes: ['nature', 'wonder'], title: 'The Mist' },
    'i-watch-my-hair': { themes: ['identity'], title: 'I watch my hair' },
    'falling-in-love': { themes: ['identity', 'love'], title: 'Falling in love with who I am vs who I could be' },
    'ariel': { themes: ['love', 'identity'], title: 'ariel' },
    'my-friend-who-died': { themes: ['mortality'], title: 'my friend who died' },
    'sometimes-i-listen-to-these-poets': { themes: ['identity'], title: 'Sometimes I listen to these poets' },
    'everytime-you-wink-at-me': { themes: ['love'], title: 'Everytime you wink at me' },
    'in-my-heart-something-called-to-the-rain': { themes: ['nature'], title: 'In my heart something called to the rain' },
    'platitudes-of-suffering': { themes: ['identity'], title: 'Platitudes Of Suffering' },
    'i-will-always-be-a-poet': { themes: ['identity'], title: 'I will always be a poet' },
    'large-objects': { themes: ['identity'], title: 'Large objects exert a gravitational pull' },
    'i-watched-a-butterfly-today': { themes: ['nature', 'wonder'], title: 'I watched a butterfly today' },
    'this-growing-older': { themes: ['mortality'], title: 'This growing older' },
    'time-in-a-fig-grove': { themes: ['nature', 'mortality'], title: 'Time in a Fig Grove' },
    'i-left-my-heart-at-home-today': { themes: ['love', 'identity'], title: 'I left my heart at home today' },
    'how-can-you-just-be-gone': { themes: ['mortality'], title: 'How can you just be gone' },
    'song-of-tomorrow': { themes: ['mortality', 'wonder'], title: 'Song of Tomorrow' },
    'i-listen': { themes: ['mortality'], title: 'I listen' },
    'hark-my-love': { themes: ['nature', 'wonder'], title: 'Hark my love' },
    'california': { themes: ['place', 'nature'], title: 'California' },
    'i-was-feeling-sorry-for-a-moth': { themes: ['wonder', 'nature'], title: 'I was feeling sorry for a moth' },
    'oh-that-again': { themes: ['wonder'], title: 'Oh that again I might see such beauty in my life' },
    'i-saw-something-beautiful-today': { themes: ['wonder'], title: 'I saw something beautiful today' },
    'the-sun-kissed-the-mountains': { themes: ['wonder', 'nature'], title: 'The sun kissed the mountains' },
    'i-feel-sad-about-endings': { themes: ['identity', 'mortality'], title: 'I feel sad about endings' },
    'mama': { themes: ['identity', 'mortality'], title: 'Mama was what we called him' },
    'do-you-miss-me': { themes: ['love'], title: 'Do you miss me' },
    'when-i-dance-with-you': { themes: ['love'], title: 'When I dance with you' },
    'guadalajara': { themes: ['place'], title: 'Guadalajara' },
};

const themeLabels = {
    wonder: 'wonder',
    mortality: 'mortality & time',
    love: 'love',
    place: 'place',
    nature: 'nature',
    identity: 'identity'
};

(function() {
    // Get current poem slug from URL
    const path = window.location.pathname;
    const match = path.match(/\/poems\/(.+)\.html$/);
    if (!match) return;
    const slug = match[1];
    const current = poemData[slug];
    if (!current) return;

    // Find related poems (share at least one theme, not self)
    const related = [];
    for (const [otherSlug, data] of Object.entries(poemData)) {
        if (otherSlug === slug) continue;
        const shared = data.themes.filter(t => current.themes.includes(t));
        if (shared.length > 0) {
            related.push({ slug: otherSlug, ...data, shared });
        }
    }

    // Shuffle and pick up to 3
    for (let i = related.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [related[i], related[j]] = [related[j], related[i]];
    }
    const picks = related.slice(0, 3);
    if (picks.length === 0) return;

    // Build the "explore more" stanza
    const endSlide = document.querySelector('.stanza.end-slide');
    if (!endSlide) return;

    const exploreDiv = document.createElement('div');
    exploreDiv.className = 'stanza explore-slide';

    const themeText = current.themes.map(t => themeLabels[t] || t).join(' & ');
    let html = '<div class="stanza-text explore-text">';
    html += '<div class="explore-label">More poems about ' + themeText + '</div>';
    html += '<div class="explore-links">';
    picks.forEach(p => {
        html += '<a href="/poems/' + p.slug + '.html">' + p.title + '</a>';
    });
    html += '</div></div>';

    exploreDiv.innerHTML = html;
    endSlide.parentNode.insertBefore(exploreDiv, endSlide);
})();
