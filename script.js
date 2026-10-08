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
