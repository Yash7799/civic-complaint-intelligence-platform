// client-side interactions: form submission, image preview, location
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('complaint-form');
  const preview = document.getElementById('preview');
  const imagesInput = document.getElementById('images');
  const status = document.getElementById('form-status');
  const useLocationBtn = document.getElementById('use-location');

  imagesInput.addEventListener('change', () => {
    preview.innerHTML = '';
    const files = imagesInput.files;
    if (!files) return;
    Array.from(files).slice(0,6).forEach(file => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.width = '120px';
      img.style.marginRight = '8px';
      img.style.marginTop = '8px';
      preview.appendChild(img);
    });
  });

  useLocationBtn && useLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    useLocationBtn.disabled = true;
    useLocationBtn.textContent = 'Locating...';
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      document.getElementById('lat').value = lat;
      document.getElementById('lng').value = lng;
      useLocationBtn.textContent = 'Location added';
      setTimeout(() => { useLocationBtn.textContent = 'Use my location'; useLocationBtn.disabled = false; }, 1500);
    }, err => {
      alert('Unable to get location');
      useLocationBtn.disabled = false;
      useLocationBtn.textContent = 'Use my location';
    })
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const formData = new FormData(form);
    try {
      const res = await fetch('/api/complaints', { method: 'POST', body: formData });
      const json = await res.json();
      if (res.ok && json.success) {
        status.textContent = 'Complaint submitted. ID: ' + json.id;
        form.reset();
        preview.innerHTML = '';
      } else {
        status.textContent = (json.error || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      status.textContent = 'Network error';
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Complaint';
  });

});
