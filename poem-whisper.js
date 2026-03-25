// Poetry whispers — lines appear, linger, then fade to make room for new ones
(function() {
    var whispers = [
        { line: 'In the morning you can listen to the mist', href: '/poems/the-mist.html' },
        { line: 'To know me is to know joy', href: '/poems/to-know-me.html' },
        { line: "I don\u2019t know where my body ends", href: '/poems/when-i-dance-with-you.html' },
        { line: 'Today is enough', href: '/poems/song-of-tomorrow.html' },
        { line: 'The world asked me if I wanted to call you today', href: '/poems/do-you-miss-me.html' },
        { line: 'Have you ever felt hands so soft', href: '/poems/these-water-nymphs.html' },
        { line: 'If you shave my chest to expose my heart', href: '/poems/i-will-always-be-a-poet.html' },
        { line: 'As a single flower, opened and yet unmarked', href: '/poems/oh-that-again.html' },
        { line: 'We take so much time to build our houses', href: '/poems/glass-houses.html' },
        { line: 'These days are gone, never can they return', href: '/poems/these-days-are-gone.html' },
        { line: 'Every decade we die and are reborn', href: '/poems/this-growing-older.html' },
        { line: 'One beautiful moment where you don\u2019t have to decide anything', href: '/poems/one-beautiful-moment.html' },
        { line: 'The light sings to me in the morning', href: '/poems/the-light-sings.html' },
        { line: 'Till time razes these mountains to the ground', href: '/poems/kashmir.html' },
        { line: 'I left my heart at home today', href: '/poems/i-left-my-heart-at-home-today.html' },
        { line: 'Whose to say we aren\u2019t the moth', href: '/poems/i-was-feeling-sorry-for-a-moth.html' },
        { line: 'Dream, dream dream, little tree', href: '/poems/hark-my-love.html' },
        { line: 'To be alone with the mountains is a special gift', href: '/poems/to-be-alone.html' },
        { line: 'It was hard to tell which person was being held', href: '/poems/today-i-saw-a-man-on-a-leash.html' },
        { line: 'His eyes did not know how beautiful he was', href: '/poems/his-hair-was-curly.html' }
    ];

    // Don't run on mobile
    if (window.innerWidth <= 768) return;

    // Shuffle
    for (var i = whispers.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = whispers[i]; whispers[i] = whispers[j]; whispers[j] = tmp;
    }

    var placedPositions = [];
    var visibleEls = [];       // queue of currently visible whisper elements
    var index = 0;
    var MAX_VISIBLE = 8;       // start fading oldest once we exceed this

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function fadeOutOldest() {
        if (visibleEls.length <= MAX_VISIBLE) return;

        var entry = visibleEls.shift();
        var el = entry.el;
        var posIndex = entry.posIndex;

        // Gentle fade: transition color to transparent over 2 seconds
        el.style.transition = 'color 2s ease, opacity 2s ease';
        el.style.color = 'transparent';
        el.style.opacity = '0';

        // After the fade completes, remove the element and free its position
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
            // Remove from placedPositions so future whispers can use that spot
            placedPositions[posIndex] = null;
        }, 2100);
    }

    function placeWhisper() {
        // Cycle back to the start once all lines have been shown
        if (index >= whispers.length) {
            index = 0;
            // Re-shuffle for variety on each pass
            for (var i = whispers.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = whispers[i]; whispers[i] = whispers[j]; whispers[j] = tmp;
            }
        }

        var whisper = whispers[index++];

        // Find a position within the CURRENT scroll view, in page coordinates
        var scrollY = window.scrollY || window.pageYOffset;
        var vh = window.innerHeight;
        var vw = window.innerWidth;
        var pageH = document.body.scrollHeight;

        // Pick a spot within the visible area, in absolute page coordinates
        var attempts = 0;
        var absX, absY;
        do {
            // Prefer edges: left margin, right margin, or between sections
            var zone = Math.floor(Math.random() * 4);
            switch (zone) {
                case 0: // Left margin — well clear of nav
                    absX = rand(10, Math.min(160, vw * 0.1));
                    absY = scrollY + rand(vh * 0.15, vh * 0.85);
                    break;
                case 1: // Right margin — well clear of content
                    absX = Math.max(vw * 0.75, 800) + rand(20, vw * 0.15);
                    absY = scrollY + rand(vh * 0.15, vh * 0.85);
                    break;
                case 2: // Top margin — generous buffer
                    absX = rand(vw * 0.15, vw * 0.8);
                    absY = scrollY + rand(vh * 0.02, vh * 0.08);
                    break;
                case 3: // Bottom margin — generous buffer
                    absX = rand(vw * 0.15, vw * 0.8);
                    absY = scrollY + rand(vh * 0.9, vh * 0.97);
                    break;
            }
            // Clamp to page bounds
            absY = Math.min(absY, pageH - 30);
            absX = Math.min(absX, vw - 200);

            attempts++;
        } while (tooClose(absX, absY) && attempts < 30);

        var posIndex = placedPositions.length;
        placedPositions.push({ x: absX, y: absY });

        var el = document.createElement('a');
        el.className = 'poem-whisper';
        el.href = whisper.href;
        el.textContent = whisper.line;
        el.style.position = 'absolute';
        el.style.left = absX + 'px';
        el.style.top = absY + 'px';
        el.style.transform = 'rotate(' + (rand(-3, 3)).toFixed(1) + 'deg)';
        el.style.zIndex = '1';
        document.body.appendChild(el);

        setTimeout(function() { el.classList.add('visible'); }, 50);

        // Track this element in the visible queue
        visibleEls.push({ el: el, posIndex: posIndex });

        // If we've exceeded the max, fade out the oldest
        fadeOutOldest();

        // Always schedule next whisper — the cycle never ends
        setTimeout(placeWhisper, Math.floor(rand(8000, 13000)));
    }

    function tooClose(x, y) {
        for (var i = 0; i < placedPositions.length; i++) {
            if (placedPositions[i] === null) continue;
            var dx = x - placedPositions[i].x;
            var dy = y - placedPositions[i].y;
            if (Math.sqrt(dx * dx + dy * dy) < 180) return true;
        }
        return false;
    }

    // First whisper after 5-8 seconds
    setTimeout(placeWhisper, Math.floor(rand(5000, 8000)));
})();
