// Poetry haunting the page — a whisper drifting through different places
(function() {
    var whispers = [
        { line: 'In the morning you can listen to the mist', href: '/poems/the-mist.html' },
        { line: 'To know me is to know joy', href: '/poems/to-know-me.html' },
        { line: "I don\u2019t know where my body ends", href: '/poems/when-i-dance-with-you.html' },
        { line: 'Today is enough', href: '/poems/song-of-tomorrow.html' },
        { line: 'The world asked me if I wanted to call you today', href: '/poems/do-you-miss-me.html' },
        { line: 'Have you ever felt hands so soft', href: '/poems/these-water-nymphs.html' },
        { line: 'If you shave my chest to expose my heart', href: '/poems/i-will-always-be-a-poet.html' }
    ];

    // Don't run on mobile
    if (window.innerWidth <= 768) return;

    var el = document.createElement('a');
    el.className = 'poem-whisper';
    el.style.display = 'none';
    document.body.appendChild(el);

    var lastIndex = -1;
    var lastLocation = -1;

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Location strategies — each returns a parent element and a CSS class
    function getLocations() {
        var locations = [];

        // 1. Nav sidebar (original position)
        var nav = document.querySelector('nav');
        if (nav) {
            locations.push({ parent: nav, className: 'poem-whisper--nav' });
        }

        // 2. Near the page header
        var pageHeader = document.querySelector('.page-header') || document.querySelector('.intro');
        if (pageHeader) {
            locations.push({ parent: pageHeader, className: 'poem-whisper--header' });
        }

        // 3. Between content sections — pick a random .piece, .home-section, or .poetry-moment
        var sections = document.querySelectorAll('.piece, .home-section, .poetry-moment, .poem-row');
        if (sections.length > 1) {
            var sectionIndex = rand(0, Math.min(sections.length - 2, sections.length - 1));
            var section = sections[sectionIndex];
            if (section && section.parentNode) {
                locations.push({ parent: section.parentNode, insertBefore: section.nextSibling, className: 'poem-whisper--between' });
            }
        }

        // 4. Near footer/contact area
        var contact = document.querySelector('.contact-row');
        if (contact) {
            locations.push({ parent: contact.parentNode, insertBefore: contact, className: 'poem-whisper--footer' });
        }

        // 5. After main content (bottom of main)
        var main = document.querySelector('main');
        if (main) {
            locations.push({ parent: main, className: 'poem-whisper--bottom' });
        }

        return locations;
    }

    function pickRandom(arr, excludeIndex) {
        if (arr.length === 0) return null;
        if (arr.length === 1) return { item: arr[0], index: 0 };
        var index;
        do {
            index = rand(0, arr.length - 1);
        } while (index === excludeIndex && arr.length > 1);
        return { item: arr[index], index: index };
    }

    function cycle() {
        // Pick a new poem line (different from last)
        var pick = pickRandom(whispers, lastIndex);
        if (!pick) return;
        var whisper = pick.item;
        lastIndex = pick.index;

        // Pick a new location (different from last)
        var locations = getLocations();
        if (locations.length === 0) return;
        var locPick = pickRandom(locations, lastLocation);
        var loc = locPick.item;
        lastLocation = locPick.index;

        // Remove from current parent
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }

        // Reset class and content
        el.className = 'poem-whisper ' + loc.className;
        el.href = whisper.href;
        el.textContent = whisper.line;
        el.style.display = '';

        // Place into new location
        if (loc.insertBefore) {
            loc.parent.insertBefore(el, loc.insertBefore);
        } else {
            loc.parent.appendChild(el);
        }

        // Fade in after a brief moment (let DOM settle)
        setTimeout(function() {
            el.classList.add('visible');
        }, 50);

        // Hold for ~8 seconds, then fade out
        setTimeout(function() {
            el.classList.remove('visible');

            // After fade-out transition completes (~2s), wait 10-15s, then cycle again
            setTimeout(function() {
                el.style.display = 'none';
                var waitTime = rand(10000, 15000);
                setTimeout(cycle, waitTime);
            }, 2000);
        }, 8000);
    }

    // Initial delay: 5-8 seconds before first appearance
    var initialDelay = rand(5000, 8000);
    setTimeout(cycle, initialDelay);
})();
