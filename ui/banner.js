/* Shared placeholder only. No ad SDK or impression tracking. */
(() => {
  const height=60;
  document.documentElement.classList.add('kr-banner-enabled');
  document.documentElement.style.setProperty('--kr-banner-height',height+'px');
  window.KingRicoViewport={get height(){return Math.max(1,(window.innerHeight||document.documentElement.clientHeight)-height);}};
  const mount=()=>{
    if(document.getElementById('kr-ad-banner'))return;
    const banner=document.createElement('div');banner.id='kr-ad-banner';banner.textContent='BANNER';
    banner.setAttribute('role','img');banner.setAttribute('aria-label','Espaço reservado para banner de anúncio');
    document.body.appendChild(banner);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
