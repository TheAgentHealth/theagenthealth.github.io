const button = document.querySelector('#copy');
button?.addEventListener('click', async () => {
  const commands = document.querySelector('#commands').textContent;
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(commands);
    button.textContent = 'Copied ✓';
    status.textContent = 'Quick start commands copied.';
    setTimeout(() => { button.textContent = 'Copy commands'; }, 2000);
  } catch {
    status.textContent = 'Copy unavailable. Select the commands to copy them manually.';
    button.textContent = 'Select to copy';
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('#commands'));
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

// Replay the illustrative check sequence on a loop while the terminal is in view.
const terminal = document.querySelector('.terminal');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (terminal && !motionPreference.matches) {
  const badges = [...terminal.querySelectorAll('.tree b')];
  const message = terminal.querySelector('.result-message');
  const icon = terminal.querySelector('.result-icon');
  const timers = [];
  const loopPause = 2600;
  let inView = false;
  const finish = () => {
    badges.forEach(badge => {
      badge.className = 'check-complete';
      badge.textContent = '✓ HEALTHY';
    });
    terminal.classList.remove('is-checking');
    message.textContent = 'Ready to work.';
    icon.classList.remove('spinner');
    icon.textContent = '✓';
    if (inView && !motionPreference.matches) {
      timers.push(setTimeout(play, loopPause));
    }
  };
  const play = () => {
    terminal.classList.add('is-checking');
    message.textContent = 'Checking system…';
    icon.textContent = '';
    icon.classList.add('spinner');
    badges.forEach((badge, index) => {
      badge.className = 'check-pending';
      badge.textContent = 'QUEUED';
      timers.push(setTimeout(() => {
        badge.className = 'check-loading';
        badge.textContent = 'CHECKING';
      }, index * 650));
      timers.push(setTimeout(() => {
        badge.className = 'check-complete';
        badge.textContent = '✓ HEALTHY';
      }, index * 650 + 850));
    });
    timers.push(setTimeout(finish, badges.length * 650 + 400));
  };
  const stop = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      inView = entry.isIntersecting;
      if (inView && !motionPreference.matches) {
        stop();
        play();
      } else {
        stop();
      }
    });
  }, { threshold: 0.35 });
  observer.observe(terminal);
  motionPreference.addEventListener('change', event => {
    if (event.matches) {
      inView = false;
      stop();
      finish();
    }
  });
}

// Capability tabs support pointer input and the standard tab keyboard pattern.
const capabilityTabs = [...document.querySelectorAll('.capability-tabs [role="tab"]')];
function selectCapability(selected, moveFocus = false) {
  capabilityTabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
  if (moveFocus) selected.focus();
}
capabilityTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCapability(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % capabilityTabs.length;
    if (event.key === 'ArrowLeft') next = (index + capabilityTabs.length - 1) % capabilityTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = capabilityTabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectCapability(capabilityTabs[next], true);
    }
  });
});

// AgentHealth is a health observer; these animated paths represent probes,
// rather than routing the application's prompts through the health engine.
const systemDiagram = document.querySelector('.system-diagram');
if (systemDiagram) {
  const map = systemDiagram.querySelector('.system-map');
  const hub = systemDiagram.querySelector('.health-hub');
  const targets = [...systemDiagram.querySelectorAll('[data-health-target]')];
  const svg = systemDiagram.querySelector('.ping-connections');
  const paths = svg.querySelector('.ping-paths');
  const replay = systemDiagram.querySelector('.replay-pings');
  const message = systemDiagram.querySelector('.hub-message');
  const count = systemDiagram.querySelector('.hub-count');
  const timers = [];
  const svgNS = 'http://www.w3.org/2000/svg';
  let started = false;
  let scanning = false;
  const groups = targets.map(() => {
    const group = document.createElementNS(svgNS, 'g');
    group.classList.add('ping-group');
    for (const className of ['ping-track', 'ping-pulse']) {
      const path = document.createElementNS(svgNS, 'path');
      path.classList.add(className);
      group.append(path);
    }
    paths.append(group);
    return group;
  });
  function drawConnections() {
    const bounds = map.getBoundingClientRect();
    const center = hub.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    targets.forEach((target, index) => {
      const box = target.getBoundingClientRect();
      const left = box.left < center.left;
      const x1 = (mobile ? center.left + center.width / 2 : left ? center.left : center.right) - bounds.left;
      const y1 = (mobile ? center.bottom : center.top + center.height / 2) - bounds.top;
      const x2 = (mobile ? box.left + box.width / 2 : left ? box.right : box.left) - bounds.left;
      const y2 = (mobile ? box.top : box.top + box.height / 2) - bounds.top;
      const d = mobile
        ? `M ${x1} ${y1} C ${x1} ${y1 + 25}, ${x2} ${y2 - 25}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
      [...groups[index].children].forEach(path => path.setAttribute('d', d));
      groups[index].style.setProperty('--path-length', groups[index].firstChild.getTotalLength());
    });
  }
  function finishSystemCheck() {
    timers.splice(0).forEach(clearTimeout);
    scanning = false;
    systemDiagram.classList.remove('is-scanning');
    targets.forEach((target, index) => {
      target.classList.remove('is-pending', 'is-pinging');
      target.classList.add('is-healthy');
      const status = target.querySelector('.node-status');
      status.textContent = '✓';
      status.setAttribute('aria-label', 'Healthy');
      groups[index].classList.remove('is-pinging');
      groups[index].classList.add('is-healthy');
    });
    message.textContent = 'System ready';
    count.textContent = `${targets.length} / ${targets.length} checks healthy`;
    replay.disabled = false;
  }
  function runSystemCheck() {
    if (scanning) return;
    started = true;
    if (motionPreference.matches) {
      finishSystemCheck();
      return;
    }
    scanning = true;
    drawConnections();
    replay.disabled = true;
    systemDiagram.classList.add('is-scanning');
    message.textContent = 'Pinging the system…';
    count.textContent = `0 / ${targets.length} checks healthy`;
    let completed = 0;
    targets.forEach((target, index) => {
      target.classList.remove('is-healthy');
      target.classList.add('is-pending');
      const status = target.querySelector('.node-status');
      status.textContent = '·';
      status.setAttribute('aria-label', 'Queued');
      groups[index].classList.remove('is-healthy');
      timers.push(setTimeout(() => {
        target.classList.remove('is-pending');
        target.classList.add('is-pinging');
        status.setAttribute('aria-label', 'Checking');
        groups[index].classList.add('is-pinging');
      }, index * 350));
      timers.push(setTimeout(() => {
        target.classList.remove('is-pinging');
        target.classList.add('is-healthy');
        status.textContent = '✓';
        status.setAttribute('aria-label', 'Healthy');
        groups[index].classList.remove('is-pinging');
        groups[index].classList.add('is-healthy');
        completed += 1;
        count.textContent = `${completed} / ${targets.length} checks healthy`;
        if (completed === targets.length) finishSystemCheck();
      }, index * 350 + 1200));
    });
  }
  new ResizeObserver(drawConnections).observe(map);
  const systemObserver = new IntersectionObserver(entries => {
    if (!started && entries.some(entry => entry.isIntersecting)) {
      systemObserver.disconnect();
      runSystemCheck();
    }
  }, {threshold: 0.2});
  systemObserver.observe(map);
  replay.addEventListener('click', runSystemCheck);
  motionPreference.addEventListener('change', event => {
    if (event.matches) finishSystemCheck();
  });
}

// Fade in resource cards, workflow items, and questions as they scroll into view.
const revealTargets = [...document.querySelectorAll('.resource-grid .resource-card, .ecosystem-grid article, .questions>div')];
revealTargets.forEach(el => el.classList.add('reveal'));
if (motionPreference.matches) {
  revealTargets.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));
  motionPreference.addEventListener('change', event => {
    if (event.matches) {
      revealObserver.disconnect();
      revealTargets.forEach(el => el.classList.add('is-visible'));
    }
  });
}
