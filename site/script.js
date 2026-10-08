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

// Play the illustrative check sequence once when the terminal enters view.
const terminal = document.querySelector('.terminal');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (terminal && !motionPreference.matches) {
  const badges = [...terminal.querySelectorAll('.tree b')];
  const message = terminal.querySelector('.result-message');
  const icon = terminal.querySelector('.result-icon');
  const timers = [];
  const finish = () => {
    timers.forEach(clearTimeout);
    badges.forEach(badge => {
      badge.className = 'check-complete';
      badge.textContent = '✓ HEALTHY';
    });
    terminal.classList.remove('is-checking');
    message.textContent = 'Ready to work.';
    icon.classList.remove('spinner');
    icon.textContent = '✓';
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
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      if (!motionPreference.matches) play();
    }
  }, { threshold: 0.35 });
  observer.observe(terminal);
  motionPreference.addEventListener('change', event => {
    if (event.matches) {
      observer.disconnect();
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
