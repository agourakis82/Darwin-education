const themeInitScript = `(function(){try{var k='darwin-theme';var t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'&&t!=='system'){t='system';}var s=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var r=t==='system'?s:t;var d=document.documentElement;d.classList.remove('light','dark');d.classList.add(r);d.setAttribute('data-theme',t);d.style.colorScheme=r;}catch(e){var d=document.documentElement;d.classList.remove('light');d.classList.add('dark');d.setAttribute('data-theme','system');d.style.colorScheme='dark';}})();`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
}
