// Poetry leaking into the nav — a whisper, not a feature
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

    var nav = document.querySelector('nav');
    if (!nav || !nav.querySelector('.nav-name')) return;

    var whisper = whispers[Math.floor(Math.random() * whispers.length)];

    var el = document.createElement('a');
    el.href = whisper.href;
    el.className = 'nav-whisper';
    el.textContent = whisper.line;
    nav.appendChild(el);

    setTimeout(function() {
        el.classList.add('visible');
    }, 5000);
})();
