const INSPECTOR_SCRIPT = `
<style>
  .__inspector_outline__ { outline: 2px solid #3b82f6 !important; }
</style>
<script>
(function __inspector__() {
  var pinned = null;
  var lastHovered = null;
  var PROPS = [
    'color','background-color','display','position',
    'padding','margin','font-size','font-weight',
    'width','height','flex-direction','justify-content',
    'align-items','z-index','overflow','border-radius',
    'gap','grid-template-columns','object-fit','transform'
  ];

  function getStyles(el) {
    var cs = getComputedStyle(el);
    var styles = {};
    PROPS.forEach(function(p) { styles[p] = cs.getPropertyValue(p); });
    return styles;
  }

  function getSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.className && typeof el.className === 'string') return el.tagName.toLowerCase() + '.' + el.className.split(' ').join('.');
    return el.tagName.toLowerCase();
  }

  document.addEventListener('mouseover', function(e) {
    if (pinned) return;
    var t = e.target;
    if (t === document.body || t === document.documentElement) return;
    if (lastHovered && lastHovered !== t) {
      lastHovered.classList.remove('__inspector_outline__');
    }
    t.classList.add('__inspector_outline__');
    lastHovered = t;
    parent.postMessage({ type: 'inspector-hover', selector: getSelector(t), styles: getStyles(t), x: e.clientX, y: e.clientY }, '*');
  });

  document.addEventListener('mouseout', function(e) {
    if (pinned) return;
    e.target.classList.remove('__inspector_outline__');
    lastHovered = null;
    parent.postMessage({ type: 'inspector-hover-end' }, '*');
  });

  document.addEventListener('click', function(e) {
    e.preventDefault();
    var t = e.target;
    if (t === document.body || t === document.documentElement) return;
    if (pinned === t) {
      pinned.classList.remove('__inspector_outline__');
      pinned = null;
      parent.postMessage({ type: 'inspector-unpin' }, '*');
      return;
    }
    if (pinned) pinned.classList.remove('__inspector_outline__');
    pinned = t;
    t.classList.add('__inspector_outline__');
    parent.postMessage({ type: 'inspector-pin', selector: getSelector(t), styles: getStyles(t) }, '*');
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pinned) {
      pinned.classList.remove('__inspector_outline__');
      pinned = null;
      parent.postMessage({ type: 'inspector-unpin' }, '*');
    }
  });
})();
</script>`

export function buildSrcdoc(html: string, css: string, includeInspector?: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
${html}${includeInspector ? INSPECTOR_SCRIPT : ''}
</body>
</html>`
}
