import type { FC } from "hono/jsx"

interface Props {
  className?: string
}

export const ThemeToggle: FC<Props> = ({ className }) => (
  <button onclick="toggleTheme()" class={className || "theme-btn"} title="Toggle theme" id="theme-toggle-btn">
    <svg class="ti-sun" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
    <svg class="ti-moon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg class="ti-monitor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  </button>
)

export const THEME_SCRIPT = `
(function(){
  var vars=[
    ["--bg","#f5f6fa","#0f1119"],
    ["--body-bg","#f5f6fa","#0f1119"],
    ["--text","#1a1d29","#e4e6eb"],
    ["--text-secondary","#6b6f80","#b0b4c0"],
    ["--border","#e2e4eb","#2a2d3a"],
    ["--card-bg","#ffffff","#1a1d29"],
    ["--accent","#4f7cff","#4f7cff"],
    ["--header-bg","#ffffff","#1a1d29"],
    ["--header-border","#dee2e6","#2a2d3a"],
    ["--table-header-bg","#f5f6fa","#1a1d29"],
    ["--accent-light","#e8edff","#1e2a45"],
    ["--sidebar-bg","#ffffff","#0f1119"],
    ["--sidebar-text","#1a1d29","#a0a4b8"],
    ["--sidebar-hover","#f0f2f5","#1a1d29"],
    ["--sidebar-active","#4f7cff","#4f7cff"],
    ["--sidebar-active-text","#ffffff","#ffffff"],
    ["--sidebar-border","#e2e4e8","rgba(255,255,255,0.06)"],
    ["--sidebar-logo","#1a1d29","#ffffff"],
    ["--sidebar-version","#9aa0b0","rgba(255,255,255,0.3)"],
    ["--sidebar-btn-border","#d0d2d8","rgba(255,255,255,0.15)"],
  ];
  function setVars(){
    var e=document.documentElement;
    var t=e.getAttribute("data-theme");
    for(var r of vars)e.style.setProperty(r[0],t==="dark"?r[2]:r[1]);
  }
  function setIcon(){
    var p=localStorage.getItem("__nexusTheme")||"system";
    var s=document.querySelector(".ti-sun");
    var m=document.querySelector(".ti-moon");
    var n=document.querySelector(".ti-monitor");
    [s,m,n].forEach(function(e){if(e)e.style.display="none"});
    if(p==="dark"&&m)m.style.display="block";
    else if(p==="light"&&s)s.style.display="block";
    else if(n)n.style.display="block";
  }
  function setThemeAttr(r){
    document.documentElement.setAttribute("data-theme",r);
    document.documentElement.setAttribute("data-bs-theme",r);
  }
  var n=localStorage.getItem("__nexusTheme")||"system";
  if(n==="dark"||(n==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches)){
    setThemeAttr("dark");
  }else{
    setThemeAttr("light");
  }
  setVars();setIcon();
  window.toggleTheme=function(){
    var t=localStorage.getItem("__nexusTheme")||"system";
    var m={system:"light",light:"dark",dark:"system"};
    var r=m[t]||"system";
    localStorage.setItem("__nexusTheme",r);
    if(r==="dark")setThemeAttr("dark");
    else if(r==="light")setThemeAttr("light");
    else{
      var i=window.matchMedia("(prefers-color-scheme:dark)").matches;
      setThemeAttr(i?"dark":"light");
    }
    setVars();setIcon();
  };
})();
`
