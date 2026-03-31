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
    'everywhere-i-turn': { themes: ['love', 'mortality'], title: 'Everywhere I turn' },
    'freedom-yet-unabridged': { themes: ['mortality', 'identity'], title: 'Freedom, yet unabridged' },
    'when-i-laugh': { themes: ['love'], title: 'When I laugh' },
    'these-water-nymphs': { themes: ['wonder', 'nature'], title: 'These water nymphs' },
    'one-beautiful-moment': { themes: ['mortality', 'wonder'], title: 'One beautiful moment' },
    'wedding-poem': { themes: ['love', 'place'], title: 'Wedding Poem' },
    'out-of-many-one': { themes: ['identity', 'love'], title: 'Out of many, one' },
    'today-birds': { themes: ['mortality', 'nature'], title: 'Today' },
    'did-you-know': { themes: ['wonder', 'nature', 'identity'], title: 'Did you know there are spiders with only 5 legs' },
    'burned-invitingly': { themes: ['identity', 'mortality'], title: 'Burned invitingly' },
    'these-days-are-gone': { themes: ['mortality'], title: 'These days are gone' },
    'the-light-sings': { themes: ['nature'], title: 'The light sings to me in the morning' },
    'xoxo': { themes: ['love'], title: 'Xoxo' },
    'a-wedding-toast': { themes: ['love', 'wonder'], title: 'A wedding toast' },
    'glass-houses': { themes: ['mortality'], title: 'Glass houses' },
    'to-be-alone': { themes: ['nature', 'wonder'], title: 'To be alone' },
    'to-flutter': { themes: ['identity'], title: 'To flutter' },
    'to-know-me': { themes: ['identity', 'love'], title: 'To know me' },
    'when-you-were-young': { themes: ['identity'], title: 'When you were young' },
    'blood-oh-once-you-called': { themes: ['identity', 'mortality'], title: 'Blood oh once you called to me' },
    'today-i-write-about-red': { themes: ['wonder', 'identity'], title: 'Today I write about Red' },
    'today-i-saw-a-man-on-a-leash': { themes: ['identity', 'wonder'], title: 'Today I saw a man on a leash' },
    'to-see-such-beauty': { themes: ['wonder', 'nature'], title: 'To see such beauty' },
    'dear-bottle': { themes: ['love'], title: 'Dear bottle' },
    'there-is-a-soft-tingle': { themes: ['nature', 'mortality'], title: 'There is a soft tingle I feel' },
    'today-if-there-is-tomorrow': { themes: ['mortality', 'wonder'], title: 'Today if there is tomorrow' },
    'and-now-that-we-walk': { themes: ['identity'], title: 'And now that we walk in these days of light' },
    'everyday-i-can-spend': { themes: ['love', 'mortality'], title: 'Everyday I can spend' },
    'its-funny': { themes: ['love', 'identity'], title: 'one year on' },
    'london': { themes: ['place', 'identity'], title: 'London' },
    'park': { themes: ['place', 'wonder', 'identity'], title: 'Park' },
    'sometimes-i-feel-cold': { themes: ['identity', 'mortality'], title: 'sometimes I feel cold' },
    'sometimes-quaver': { themes: ['nature', 'wonder'], title: "sometimes, the whole field a\u2019quaver" },
    'sometimes-curious-feel': { themes: ['wonder', 'love'], title: 'sometimes, a curious feel' },
    'social-media-is-not-the-right-place-for-grief': { themes: ['identity', 'mortality'], title: 'Social media is not the right place for grief' },
    'thrum-thrum': { themes: ['identity', 'wonder'], title: 'thrum thrum' },
    'it-used-to-be-me': { themes: ['love', 'identity'], title: 'it used to be me' },
    'have-you-watched-creepers-creep': { themes: ['nature', 'wonder'], title: 'Have you watched creepers creep' },
    'let-tomorrow-come': { themes: ['mortality', 'wonder'], title: 'Let tomorrow come' },
    'one-in-community': { themes: ['identity', 'wonder'], title: 'One in community community community' },
    'not-in-my-life': { themes: ['identity', 'love'], title: 'Not in my life' },
    'anuraag-oh-anuraag': { themes: ['love', 'nature'], title: 'Anuraag oh Anuraag' },
    'sit-let-us-listen': { themes: ['wonder', 'nature'], title: 'Sit let us listen to the sound of this moment' },
    'oh-the-horror-i-say': { themes: ['wonder', 'identity'], title: 'Oh the horror I say' },
    'out-to-play-he-calls-them': { themes: ['nature', 'wonder'], title: 'Out to play He calls them' },
    'late-why-so-late': { themes: ['love', 'identity'], title: 'Late why so late' },
    'his-hair-was-curly': { themes: ['love', 'identity'], title: 'His hair was curly' },
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
    html += '</div>';

    // Cross-content links
    var crossLinks = '';
    if (slug === 'wedding-poem' || slug === 'its-funny') {
        crossLinks += '<a href="/wedding-celebration.html">From the wedding \u2192</a>';
    }
    if (current.themes.indexOf('place') !== -1) {
        crossLinks += '<a href="/photography.html">Photos from Mexico \u2192</a>';
    }
    if (crossLinks) {
        html += '<div class="explore-cross" style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e8e6e1;">' + crossLinks + '</div>';
    }

    html += '</div>';

    exploreDiv.innerHTML = html;
    endSlide.parentNode.insertBefore(exploreDiv, endSlide);
})();

// --- Progress bar ---
(function() {
    var bar = document.createElement('div');
    bar.className = 'poem-progress';
    document.body.appendChild(bar);

    var scrollContainer = document.querySelector('.poem-scroll');
    if (!scrollContainer) return;

    var stanzas = scrollContainer.querySelectorAll('.stanza');
    var total = stanzas.length;

    var progressObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var index = Array.prototype.indexOf.call(stanzas, entry.target);
                var progress = (index + 1) / total;
                bar.style.width = (progress * 100) + '%';
            }
        });
    }, { root: scrollContainer, threshold: 0.5 });

    stanzas.forEach(function(s) { progressObserver.observe(s); });
})();

// --- Auto-navigate at end ---
(function() {
    var endSlide = document.querySelector('.stanza.end-slide');
    var scrollContainer = document.querySelector('.poem-scroll');
    if (!endSlide || !scrollContainer) return;

    var endVisible = false;
    var navigating = false;

    var endObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            endVisible = entry.isIntersecting;
        });
    }, { root: scrollContainer, threshold: 0.5 });

    endObserver.observe(endSlide);

    function navigate() {
        if (navigating) return;
        navigating = true;
        scrollContainer.classList.add('fade-out');
        setTimeout(function() {
            window.location.href = '/poetry.html';
        }, 600);
    }

    // Wheel scroll past end
    scrollContainer.addEventListener('wheel', function(e) {
        if (endVisible && e.deltaY > 0) navigate();
    }, { passive: true });

    // Touch swipe up past end
    var touchY = null;
    scrollContainer.addEventListener('touchstart', function(e) {
        if (endVisible) touchY = e.touches[0].clientY;
    }, { passive: true });
    scrollContainer.addEventListener('touchend', function(e) {
        if (touchY !== null && endVisible) {
            var delta = touchY - e.changedTouches[0].clientY;
            if (delta > 60) navigate();
        }
        touchY = null;
    }, { passive: true });
})();

// Escape key → back to all poems
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Don't navigate if a video overlay is open
        var overlay = document.querySelector('[style*="position:fixed"][style*="z-index:1000"]');
        if (overlay && overlay.style.display !== 'none') return;
        window.location.href = '/poetry.html';
    }
});

// Swipe-down on title slide → back to /poetry.html
(function() {
    var titleSlide = document.querySelector('.stanza.title-slide');
    if (!titleSlide) return;

    var touchStartY = null;
    var touchStartScrollTop = 0;

    titleSlide.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        touchStartY = e.touches[0].clientY;
        // Check scroll position of the nearest scrollable ancestor or the slide itself
        var scrollable = titleSlide.closest('[style*="overflow"]') || titleSlide;
        touchStartScrollTop = scrollable.scrollTop || window.scrollY || 0;
    }, { passive: true });

    titleSlide.addEventListener('touchend', function(e) {
        if (touchStartY === null) return;
        if (e.changedTouches.length !== 1) return;

        var touchEndY = e.changedTouches[0].clientY;
        var deltaY = touchEndY - touchStartY;

        // Only trigger when swiping down at least 80px and already at top
        if (deltaY >= 80 && touchStartScrollTop <= 0) {
            window.location.href = '/poetry.html';
        }

        touchStartY = null;
    }, { passive: true });
})();
