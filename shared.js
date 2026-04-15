/* shared.js — control engine for every element page */

(function(){

  /* ── helpers ── */
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── wire all controls in the .controls-row ── */
  function wireControls(onChange){
    document.querySelectorAll('[data-cid]').forEach(function(el){
      var evt = (el.type==='range'||el.type==='color'||el.tagName==='SELECT') ? 'input' :
                (el.tagName==='INPUT') ? 'input' : null;
      if(evt) el.addEventListener(evt, function(){ onChange(el.dataset.cid, el.value); });
    });
    document.querySelectorAll('.toggle-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var grp = btn.dataset.grp;
        document.querySelectorAll('.toggle-btn[data-grp="'+grp+'"]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        onChange(btn.dataset.cid, btn.dataset.val);
      });
    });
    /* slider value labels */
    document.querySelectorAll('.ctrl-slider').forEach(function(sl){
      sl.addEventListener('input', function(){
        var lbl = document.getElementById('val-'+sl.dataset.cid);
        if(lbl) lbl.textContent = sl.value + (parseFloat(sl.max)>10?'px':'');
      });
    });
  }

  /* ── rebuild the live preview iframe from current HTML+CSS editors ── */
  function refreshPreview(){
    var hEl = document.getElementById('html-editor');
    var cEl = document.getElementById('css-editor');
    var frame = document.getElementById('preview-frame');
    if(!hEl||!cEl||!frame) return;
    var doc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>'+cEl.value+'</style></head><body>'+hEl.value+'</body></html>';
    frame.srcdoc = doc;
  }

  /* ── expose globally so element pages can call after setting up ── */
  window.SharedEngine = {
    wireControls: wireControls,
    refreshPreview: refreshPreview
  };

})();


(function () {
  const emoji = "✏️";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y=".9em" font-size="90">${emoji}</text>
    </svg>
  `;

  const url = "data:image/svg+xml," + encodeURIComponent(svg);

  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = url;
})();
