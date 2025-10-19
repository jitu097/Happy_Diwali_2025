// Keep the existing sparkler trail, add fireworks, diya toggle, share and download
(function(){
  const sparkler = document.querySelector('#sparkler');
  const fireworksCanvas = document.getElementById('fireworks-canvas');
  const toggleDiyaBtn = document.getElementById('toggleDiya');
  const changeColorBtn = document.getElementById('changeColorBtn');
  const shareBtn = document.getElementById('shareBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const diya = document.getElementById('diya');

  // Debug: log if buttons are found
  console.log('Buttons found:', {
    toggleDiya: !!toggleDiyaBtn,
    changeColor: !!changeColorBtn,
    share: !!shareBtn,
    download: !!downloadBtn
  });	// Cursor-follow sparkler particles
	function sparkle(){
		const p = document.createElement('div');
		p.className = 'particle';
		const rect = sparkler.getBoundingClientRect();
		p.style.left = rect.x + 'px';
		p.style.top = rect.y + 'px';
		const w = (Math.floor(Math.random()*30)) + 20;
		p.style.width = w + 'vh';
		p.style.transform = `translateX(${-1*(w*.475)}vh) rotate(${Math.random()*360}deg)`;
		document.body.appendChild(p);
		setTimeout(()=>{
			const first = document.querySelector('.particle');
			first && first.remove();
		}, 256);
	}

	let shiny = setInterval(sparkle, 16);

	// track mouse location and move sparkler
	window.addEventListener('mousemove', (e)=>{
		sparkler.style.left = e.clientX + 'px';
		sparkler.style.top = e.clientY + 'px';
	});

	// Color change helper
	function randomColor(){
		return `hsl(${Math.floor(Math.random()*360)}deg 100% 55%)`;
	}
	function changeColor(){
		document.body.style.setProperty('--color-spark', randomColor());
	}

  // Attach to button and keep click-to-change
  changeColorBtn?.addEventListener('click', (e)=>{
    console.log('Change color button clicked!');
    e.stopPropagation();
    changeColor();
  });
  window.addEventListener('click', (e)=>{
    const t = e.target;
    // Ignore clicks on UI controls
    if (t.closest && t.closest('.actions')) return;
    // Also change color on general clicks (to preserve original behavior)
    changeColor();
    // Spawn a firework anywhere else (respects reduced motion inside spawn)
    spawnFirework(e.clientX, e.clientY);
  });  // Diya toggle
  toggleDiyaBtn?.addEventListener('click', (e)=>{
    console.log('Diya button clicked!');
    e.stopPropagation();
    const on = !diya.classList.contains('on');
    diya.classList.toggle('on', on);
    toggleDiyaBtn.setAttribute('aria-pressed', String(on));
    toggleDiyaBtn.textContent = on ? '🪔 Diya Lit' : '🪔 Light the Diya';
    if (on) {
      startCrackle();
    } else {
      stopCrackle();
    }
  });

	// Fireworks engine (simple, performant)
	// Reduced-motion guard
	const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let ctx, dpr = Math.min(2, window.devicePixelRatio || 1);
	function resizeCanvas(){
		if (!fireworksCanvas) return;
		fireworksCanvas.width = Math.floor(window.innerWidth * dpr);
		fireworksCanvas.height = Math.floor(window.innerHeight * dpr);
		fireworksCanvas.style.width = '100vw';
		fireworksCanvas.style.height = '100vh';
		ctx = fireworksCanvas.getContext('2d');
		ctx.scale(dpr, dpr);
	}
	if (fireworksCanvas && !prefersReduced){
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
	}

	const fireworks = [];
	function spawnFirework(x, y){
		if (prefersReduced || !ctx) return;
		const hue = Math.floor(Math.random()*360);
		const count = 24 + Math.floor(Math.random()*24);
		for (let i=0;i<count;i++){
			const angle = (Math.PI*2)*(i/count) + Math.random()*0.2;
			const speed = 2 + Math.random()*3.5;
			fireworks.push({
				x, y,
				vx: Math.cos(angle)*speed,
				vy: Math.sin(angle)*speed,
				life: 0,
				maxLife: 60 + Math.floor(Math.random()*30),
				hue,
			});
		}
	}

	// auto sporadic fireworks
	let autoTimer = 0;
	function animate(){
		if (!ctx) return;
		ctx.fillStyle = 'rgba(0,0,0,0.18)';
		ctx.fillRect(0,0,window.innerWidth, window.innerHeight);

		for (let i=fireworks.length-1;i>=0;i--){
			const p = fireworks[i];
			// gravity and drag
			p.vy += 0.03;
			p.vx *= 0.995; p.vy *= 0.995;
			p.x += p.vx; p.y += p.vy;
			p.life++;
			const alpha = Math.max(0, 1 - p.life/p.maxLife);
			const color = `hsla(${p.hue}deg,100%,60%,${alpha})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
			ctx.fillStyle = color;
			ctx.shadowColor = `hsla(${p.hue}deg,100%,60%,${Math.min(.8, alpha+.2)})`;
			ctx.shadowBlur = 12;
			ctx.fill();
			if (p.life >= p.maxLife) fireworks.splice(i,1);
		}

		autoTimer++;
		if (autoTimer % 90 === 0){
			spawnFirework(Math.random()*window.innerWidth, Math.random()*window.innerHeight*0.6 + 40);
		}
		requestAnimationFrame(animate);
	}
	if (!prefersReduced && fireworksCanvas){
		animate();
		fireworksCanvas.addEventListener('pointerdown', (e)=>{
			spawnFirework(e.clientX, e.clientY);
		});
	}

	// Share wishes
	async function shareWishes(){
		const text = 'Happy Diwali 2025! 🪔✨ Wishing you joy, prosperity, and sparkling new beginnings.';
		const url = location.href;
		if (navigator.share){
			try{ await navigator.share({title:'Happy Diwali 2025', text, url}); }catch(e){ /* user cancelled */ }
		} else {
			try{
				await navigator.clipboard.writeText(`${text}\n${url}`);
				shareBtn.textContent = '✅ Copied!';
				setTimeout(()=> shareBtn.textContent = '💌 Share Wishes', 1400);
			}catch(e){
				alert('Copied wishes: ' + text);
			}
		}
	}
  shareBtn?.addEventListener('click', (e)=>{
    console.log('Share button clicked!');
    e.stopPropagation();
    shareWishes();
  });	// Download greeting: capture current canvas plus overlay text
	function downloadGreeting(){
		const off = document.createElement('canvas');
		const w = window.innerWidth, h = window.innerHeight;
		off.width = w; off.height = h;
		const g = off.getContext('2d');

		// background snapshot: use fireworks canvas if available
		if (fireworksCanvas){
			g.drawImage(fireworksCanvas, 0, 0, fireworksCanvas.width, fireworksCanvas.height, 0, 0, w, h);
		} else {
			g.fillStyle = '#0c0f1f'; g.fillRect(0,0,w,h);
		}

		// title
		g.save();
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.font = '700 48px Segoe UI, Roboto, Arial';
		g.fillStyle = '#ffd166';
		g.shadowColor = 'rgba(255,179,71,.6)';
		g.shadowBlur = 16;
		g.fillText('Happy Diwali 2025', w/2, h*0.22);
		g.shadowBlur = 0;
		g.font = '400 20px Segoe UI, Roboto, Arial';
		g.fillStyle = 'rgba(255,255,255,.9)';
		g.fillText('Wishing you joy, prosperity, and sparkling new beginnings.', w/2, h*0.28);
		g.restore();

		// little diya
		g.save();
		const cx = w/2, cy = h - 60;
		g.fillStyle = '#3a1700';
		g.beginPath();
		g.ellipse(cx, cy, 60, 26, 0, 0, Math.PI*2);
		g.fill();
		// flame
		g.beginPath();
		g.ellipse(cx, cy-42, 12, 20, 0, 0, Math.PI*2);
		const grad = g.createRadialGradient(cx, cy-46, 2, cx, cy-42, 22);
		grad.addColorStop(0, '#fff7b3');
		grad.addColorStop(.45, '#ffbf3b');
		grad.addColorStop(1, 'rgba(255,136,0,.9)');
		g.fillStyle = grad; g.fill();
		g.restore();

		const a = document.createElement('a');
		a.download = 'happy-diwali-2025.png';
		a.href = off.toDataURL('image/png');
		a.click();
	}
  downloadBtn?.addEventListener('click', (e)=>{
    console.log('Download button clicked!');
    e.stopPropagation();
    downloadGreeting();
  });		// Subtle audio crackle when diya is on (no external assets)
		let audioCtx = null, noiseSrc = null, noiseGain = null, noiseFilter = null;
		function startCrackle(){
			try{
				if (prefersReduced) return; // respect reduced motion as a proxy for sensory effects
				if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
				if (audioCtx) return; // already playing
				const Ctx = window.AudioContext || window.webkitAudioContext;
				if (!Ctx) return;
				audioCtx = new Ctx();
				const sr = audioCtx.sampleRate;
				const buffer = audioCtx.createBuffer(1, sr * 1.0, sr); // 1 second noise
				const data = buffer.getChannelData(0);
				for (let i=0;i<data.length;i++){
					// random short crackles: sparse impulses
					const r = Math.random();
					data[i] = (r > 0.995 ? (Math.random()*2-1) * 0.9 : (Math.random()*2-1) * 0.02);
				}
				noiseSrc = audioCtx.createBufferSource();
				noiseSrc.buffer = buffer;
				noiseSrc.loop = true;
				noiseFilter = audioCtx.createBiquadFilter();
				noiseFilter.type = 'highpass';
				noiseFilter.frequency.value = 800;
				noiseGain = audioCtx.createGain();
				noiseGain.gain.value = 0.06; // subtle
				noiseSrc.connect(noiseFilter).connect(noiseGain).connect(audioCtx.destination);
				noiseSrc.start();
			}catch(e){ /* ignore audio errors */ }
		}
		function stopCrackle(){
			try{
				if (noiseSrc){ try{ noiseSrc.stop(); }catch(_){} }
				noiseSrc = null;
				if (audioCtx){
					// close to release resources (some browsers disallow close)
					if (audioCtx.close){ audioCtx.close().catch(()=>{}); }
				}
			} finally {
				audioCtx = null; noiseGain = null; noiseFilter = null;
			}
		}
})();