// home.js

const video = document.getElementById('qr-video');
const resultElement = document.getElementById('qr-result');

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then((stream) => {
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve();
      };
    });
  })
  .then(() => {
    video.play();
    requestAnimationFrame(tick);
  });

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
    const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      resultElement.innerHTML = 'QR Code detected: ' + code.data;
      window.location.href = code.data; // Redirect to the link stored in the QR code
    } else {
      resultElement.innerHTML = 'Scanning...';
    }
  }

  requestAnimationFrame(tick);
}

function redirectToGeneratePage() {
  window.location.href = '/generate';
}
