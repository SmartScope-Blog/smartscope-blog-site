// Reading progress bar for AI Daily News articles
(function(){
  const barId = 'reading-progress-bar';
  if(document.getElementById(barId)) return;
  const bar = document.createElement('div');
  bar.id = barId;
  bar.className = 'reading-progress-bar';
  document.body.appendChild(bar);

  function update(){
    const article = document.querySelector('.md-content');
    if(!article) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = Math.min(1, scrollTop / (total || 1));
    bar.style.width = (ratio*100).toFixed(2)+'%';
  }
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
  update();
  // TL;DR table auto wrapper
  function wrapTldr(){
    const h2s = Array.from(document.querySelectorAll('.md-typeset h2'));
    h2s.filter(h=>/TL;DR/.test(h.textContent)).forEach(h=>{
      let tbl = h.nextElementSibling;
      if(tbl && tbl.tagName==='TABLE' && !tbl.parentElement.classList.contains('daily-tldr-wrapper')){
        const wrap = document.createElement('div');
        wrap.className='daily-tldr-wrapper';
        tbl.parentElement.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
      }
    });
  }
  wrapTldr();
  document.addEventListener('DOMContentLoaded', wrapTldr);
  // Re-run on instant navigation (Material event)
  document.addEventListener('DOMContentSwitch', ()=>setTimeout(()=>{update();wrapTldr();},50));
})();
