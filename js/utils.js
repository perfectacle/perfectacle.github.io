/* global NexT, CONFIG */
HTMLElement.prototype.wrap=function(e){this.parentNode.insertBefore(e,this),this.parentNode.removeChild(this),e.appendChild(this)},function(){const e=()=>document.dispatchEvent(new Event("page:loaded",{bubbles:!0}));"loading"===document.readyState?document.addEventListener("readystatechange",e,{once:!0}):e(),document.addEventListener("pjax:success",e)}(),NexT.utils={registerExtURL:function(){document.querySelectorAll("span.exturl").forEach((e=>{const t=document.createElement("a");
// https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
t.href=decodeURIComponent(atob(e.dataset.url).split("").map((e=>"%"+("00"+e.charCodeAt(0).toString(16)).slice(-2))).join("")),t.rel="noopener external nofollow noreferrer",t.target="_blank",t.className=e.className,t.title=e.title,t.innerHTML=e.innerHTML,e.parentNode.replaceChild(t,e)}))},registerCodeblock:function(e){const t=!!e;let n=(t?e:document).querySelectorAll("figure.highlight"),o=!0;0===n.length&&(n=document.querySelectorAll("pre:not(.mermaid)"),o=!1),n.forEach((e=>{if(!t){let t=e.querySelectorAll(".code .line span");0===t.length&&(
// Hljs without line_number and wrap
t=e.querySelectorAll("code.highlight span")),t.forEach((e=>{e.classList.forEach((t=>{e.classList.replace(t,`hljs-${t}`)}))}))}const n=parseInt(window.getComputedStyle(e).height.replace("px",""),10),i=CONFIG.fold.enable&&n>CONFIG.fold.height;if(!i&&!CONFIG.copycode.enable)return;let c;if(o&&"mac"===CONFIG.copycode.style)c=e;else{let t=e.querySelector(".code-container");if(!t){
// https://github.com/next-theme/hexo-theme-next/issues/98
// https://github.com/next-theme/hexo-theme-next/pull/508
const n=e.querySelector(".table-container")||e;t=document.createElement("div"),t.className="code-container",n.wrap(t),
// add "notranslate" to prevent Google Translate from translating it, which also completely messes up the layout
t.classList.add("notranslate")}c=t}if(i&&!c.classList.contains("unfold")&&(c.classList.add("highlight-fold"),c.insertAdjacentHTML("beforeend",'<div class="fold-cover"></div><div class="expand-btn"><i class="fa fa-angle-down fa-fw"></i></div>'),c.querySelector(".expand-btn").addEventListener("click",(()=>{c.classList.remove("highlight-fold"),c.classList.add("unfold")}))),t||!CONFIG.copycode.enable)return;
// One-click copy code support.
c.insertAdjacentHTML("beforeend",'<div class="copy-btn"><i class="fa fa-copy fa-fw"></i></div>');const r=c.querySelector(".copy-btn");r.addEventListener("click",(()=>{const t=(e.querySelector(".code")||e.querySelector("code")).innerText;if(navigator.clipboard)
// https://caniuse.com/mdn-api_clipboard_writetext
navigator.clipboard.writeText(t).then((()=>{r.querySelector("i").className="fa fa-check-circle fa-fw"}),(()=>{r.querySelector("i").className="fa fa-times-circle fa-fw"}));else{const e=document.createElement("textarea");e.style.top=window.scrollY+"px",// Prevent page scrolling
e.style.position="absolute",e.style.opacity="0",e.readOnly=!0,e.value=t,document.body.append(e),e.select(),e.setSelectionRange(0,t.length),e.readOnly=!1;const n=document.execCommand("copy");r.querySelector("i").className=n?"fa fa-check-circle fa-fw":"fa fa-times-circle fa-fw",e.blur(),// For iOS
r.blur(),document.body.removeChild(e)}})),e.addEventListener("mouseleave",(()=>{setTimeout((()=>{r.querySelector("i").className="fa fa-copy fa-fw"}),300)}))}))},wrapTableWithBox:function(){document.querySelectorAll("table").forEach((e=>{const t=document.createElement("div");t.className="table-container",e.wrap(t)}))},registerVideoIframe:function(){document.querySelectorAll("iframe").forEach((e=>{if(["www.youtube.com","player.vimeo.com","player.youku.com","player.bilibili.com","www.tudou.com"].some((t=>e.src.includes(t)))&&!e.parentNode.matches(".video-container")){const t=document.createElement("div");t.className="video-container",e.wrap(t);const n=Number(e.width),o=Number(e.height);n&&o&&(t.style.paddingTop=o/n*100+"%")}}))},updateActiveNav:function(){if(!Array.isArray(NexT.utils.sections))return;let e=NexT.utils.sections.findIndex((e=>e&&e.getBoundingClientRect().top>10));-1===e?e=NexT.utils.sections.length-1:e>0&&e--,this.activateNavByIndex(e)},registerScrollPercent:function(){const e=document.querySelector(".back-to-top"),t=document.querySelector(".reading-progress-bar");
// For init back to top in sidebar if page was scrolled after page refresh.
window.addEventListener("scroll",(()=>{if(e||t){const n=document.body.scrollHeight-window.innerHeight,o=n>0?Math.min(100*window.scrollY/n,100):0;e&&(e.classList.toggle("back-to-top-on",Math.round(o)>=5),e.querySelector("span").innerText=Math.round(o)+"%"),t&&t.style.setProperty("--progress",o.toFixed(2)+"%")}this.updateActiveNav()}),{passive:!0}),e&&e.addEventListener("click",(()=>{window.anime({targets:document.scrollingElement,duration:500,easing:"linear",scrollTop:0})}))},
/**
   * Tabs tag listener (without twitter bootstrap).
   */
registerTabsTag:function(){
// Binding `nav-tabs` & `tab-content` by real time permalink changing.
document.querySelectorAll(".tabs ul.nav-tabs .tab").forEach((e=>{e.addEventListener("click",(t=>{
// Prevent selected tab to select again.
if(t.preventDefault(),e.classList.contains("active"))return;const n=e.parentNode,o=n.nextElementSibling;
// Get the height of `tab-pane` which is activated before, and set it as the height of `tab-content` with extra margin / paddings.
o.style.overflow="hidden",o.style.transition="height 1s";
// Comment system selection tab does not contain .active class.
const i=o.querySelector(".active")||o.firstElementChild,c=parseInt(window.getComputedStyle(i).height.replace("px",""),10)||0,r=parseInt(window.getComputedStyle(i).paddingTop.replace("px",""),10),a=parseInt(window.getComputedStyle(i.firstElementChild).marginBottom.replace("px",""),10);
// Hight might be `auto`.
o.style.height=c+r+a+"px",
// Add & Remove active class on `nav-tabs` & `tab-content`.
[...n.children].forEach((t=>{t.classList.toggle("active",t===e)}));
// https://stackoverflow.com/questions/20306204/using-queryselector-with-ids-that-are-numbers
const s=document.getElementById(e.querySelector("a").getAttribute("href").replace("#",""));[...s.parentNode.children].forEach((e=>{e.classList.toggle("active",e===s)})),
// Trigger event
s.dispatchEvent(new Event("tabs:click",{bubbles:!0}));
// Get the height of `tab-pane` which is activated now.
const l=document.body.scrollHeight>(window.innerHeight||document.documentElement.clientHeight),d=parseInt(window.getComputedStyle(o.querySelector(".active")).height.replace("px",""),10);if(
// Reset the height of `tab-content` and see the animation.
o.style.height=d+r+a+"px",
// Change the height of `tab-content` may cause scrollbar show / disappear, which may result in the change of the `tab-pane`'s height
setTimeout((()=>{if(document.body.scrollHeight>(window.innerHeight||document.documentElement.clientHeight)!==l){o.style.transition="height 0.3s linear";
// After the animation, we need reset the height of `tab-content` again.
const e=parseInt(window.getComputedStyle(o.querySelector(".active")).height.replace("px",""),10);o.style.height=e+r+a+"px"}
// Remove all the inline styles, and let the height be adaptive again.
setTimeout((()=>{o.style.transition="",o.style.height=""}),250)}),1e3),!CONFIG.stickytabs)return;const u=n.parentNode.getBoundingClientRect().top+window.scrollY+10;window.anime({targets:document.scrollingElement,duration:500,easing:"linear",scrollTop:u})}))})),window.dispatchEvent(new Event("tabs:register"))},registerCanIUseTag:function(){
// Get responsive height passed from iframe.
window.addEventListener("message",(({data:e})=>{if("string"==typeof e&&e.includes("ciu_embed")){const t=e.split(":")[1],n=e.split(":")[2];document.querySelector(`iframe[data-feature=${t}]`).style.height=parseInt(n,10)+5+"px"}}),!1)},registerActiveMenuItem:function(){document.querySelectorAll(".menu-item a[href]").forEach((e=>{const t=e.pathname===location.pathname||e.pathname===location.pathname.replace("index.html",""),n=!CONFIG.root.startsWith(e.pathname)&&location.pathname.startsWith(e.pathname);e.classList.toggle("menu-item-active",e.hostname===location.hostname&&(t||n))}))},registerLangSelect:function(){document.querySelectorAll(".lang-select").forEach((e=>{e.value=CONFIG.page.lang,e.addEventListener("change",(()=>{const t=e.options[e.selectedIndex];document.querySelectorAll(".lang-select-label span").forEach((e=>{e.innerText=t.text})),
// Disable Pjax to force refresh translation of menu item
window.location.href=t.dataset.href}))}))},registerSidebarTOC:function(){this.sections=[...document.querySelectorAll(".post-toc:not(.placeholder-toc) li a.nav-link")].map((e=>{const t=document.getElementById(decodeURI(e.getAttribute("href")).replace("#",""));
// TOC item animation navigate.
return e.addEventListener("click",(n=>{n.preventDefault();const o=t.getBoundingClientRect().top+window.scrollY;window.anime({targets:document.scrollingElement,duration:500,easing:"linear",scrollTop:o,complete:()=>{history.pushState(null,document.title,e.href)}})})),t})),this.updateActiveNav()},registerPostReward:function(){const e=document.querySelector(".reward-container button");e&&e.addEventListener("click",(()=>{document.querySelector(".post-reward").classList.toggle("active")}))},activateNavByIndex:function(e){const t=document.querySelector(".post-toc:not(.placeholder-toc) .nav");if(!t)return;const n=t.querySelectorAll(".nav-item"),o=n[e];if(!o||o.classList.contains("active-current"))return;const i=n[n.length-1].offsetHeight;t.querySelectorAll(".active").forEach((e=>{e.classList.remove("active","active-current")})),o.classList.add("active","active-current");let c=o.querySelector(".nav-child")||o.parentElement,r=0;for(;t.contains(c);)c.classList.contains("nav-item")?c.classList.add("active"):(// .nav-child or .nav
// scrollHeight isn't reliable for transitioning child items.
// The last nav-item in a list has a margin-bottom of 5px.
r+=i*c.childElementCount+5,c.style.setProperty("--height",`${r}px`)),c=c.parentElement;
// Scrolling to center active TOC element if TOC content is taller then viewport.
const a=document.querySelector("Pisces"===CONFIG.scheme||"Gemini"===CONFIG.scheme?".sidebar-panel-container":".sidebar");document.querySelector(".sidebar-toc-active")&&window.anime({targets:a,duration:200,easing:"linear",scrollTop:a.scrollTop-a.offsetHeight/2+o.getBoundingClientRect().top-a.getBoundingClientRect().top})},updateSidebarPosition:function(){if(window.innerWidth<1200||"Pisces"===CONFIG.scheme||"Gemini"===CONFIG.scheme)return;
// Expand sidebar on post detail page by default, when post has a toc.
const e=document.querySelector(".post-toc:not(.placeholder-toc)");let t=CONFIG.page.sidebar;"boolean"!=typeof t&&(
// There's no definition sidebar in the page front-matter.
t="always"===CONFIG.sidebar.display||"post"===CONFIG.sidebar.display&&e),t&&window.dispatchEvent(new Event("sidebar:show"))},activateSidebarPanel:function(e){const t=document.querySelector(".sidebar-inner"),n=["sidebar-toc-active","sidebar-overview-active"];if(t.classList.contains(n[e]))return;const o=t.querySelector(".sidebar-panel-container"),i=o.firstElementChild,c=o.lastElementChild;let r=i.scrollHeight;
// For TOC activation, try to use the animated TOC height
if(0===e){const e=i.querySelector(".nav");e&&(r=parseInt(e.style.getPropertyValue("--height"),10))}const a=[r,c.scrollHeight];o.style.setProperty("--inactive-panel-height",`${a[1-e]}px`),o.style.setProperty("--active-panel-height",`${a[e]}px`),t.classList.replace(n[1-e],n[e])},updateFooterPosition:function(){function e(){const e=document.querySelector(".footer"),t=document.querySelector(".main").offsetHeight+e.offsetHeight;e.classList.toggle("footer-fixed",t<=window.innerHeight)}"Pisces"!==CONFIG.scheme&&"Gemini"!==CONFIG.scheme&&(e(),window.addEventListener("resize",e),window.addEventListener("scroll",e,{passive:!0}))},getScript:function(e,t={},n){if("function"==typeof t)return this.getScript(e,{condition:n}).then(t);const{condition:o=!1,attributes:{id:i="",async:c=!1,defer:r=!1,crossOrigin:a="",dataset:s={},...l}={},parentNode:d=null}=t;return new Promise(((t,n)=>{if(o)t();else{const o=document.createElement("script");if(i&&(o.id=i),a&&(o.crossOrigin=a),o.async=c,o.defer=r,Object.assign(o.dataset,s),Object.entries(l).forEach((([e,t])=>{o.setAttribute(e,String(t))})),o.onload=t,o.onerror=n,"object"==typeof e){const{url:t,integrity:n}=e;o.src=t,n&&(o.integrity=n,o.crossOrigin="anonymous")}else o.src=e;(d||document.head).appendChild(o)}}))},loadComments:function(e,t){return t?this.loadComments(e).then(t):new Promise((t=>{const n=document.querySelector(e);if(!CONFIG.comments.lazyload||!n)return void t();new IntersectionObserver(((e,n)=>{e[0].isIntersecting&&(t(),n.disconnect())})).observe(n)}))}};