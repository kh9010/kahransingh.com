(function() {
    var videos = document.querySelectorAll('.video-pair video');
    if (!videos.length) return;

    // Build overlay
    var overlay = document.createElement('div');
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:#000;z-index:1000;align-items:center;justify-content:center;cursor:pointer;';
    var ov = document.createElement('video');
    ov.style.cssText = 'max-width:100%;max-height:100vh;width:100%;';
    ov.controls = true;
    ov.setAttribute('playsinline', '');
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;z-index:1001;opacity:0.7;';
    overlay.appendChild(ov);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    function open(src) {
        ov.src = src;
        ov.currentTime = 0;
        overlay.style.display = 'flex';
        ov.play();
    }
    function close() {
        ov.pause();
        ov.src = '';
        overlay.style.display = 'none';
    }

    videos.forEach(function(v) {
        v.style.cursor = 'pointer';
        v.title = 'Click to watch with sound';
        v.addEventListener('click', function(e) { e.preventDefault(); open(v.src); });
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });
})();
