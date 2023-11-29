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
      const qrData = code.data;
      resultElement.innerHTML = 'QR Code detected: ' + qrData;

      // Check if the QR code data starts with "kisaanpe.com"
      if (qrData.startsWith("kisaanpe.com")) {
        // If yes, redirect to the scanned URL
        window.location.href = "http://" + qrData;
        return;
      } else {
        // If no, display a message or handle it as needed
        resultElement.innerHTML = 'Scanning...';
      }
    } else {
      resultElement.innerHTML = 'Scanning...';
    }
    
  }

  requestAnimationFrame(tick);
}


