// const BASE = "http://localhost:8080";
// const BASE = "https://drawai-production-4194.up.railway.app";
// const BASE = "https://drawai-lhki.onrender.com";
const BASE = "https://drawai-production-ac6f.up.railway.app";

async function getPrediction(blob) {
  const formData = new FormData();
  formData.append("image", blob, "canvas.png");

  let response = await fetch(BASE + "/api/predict", {
    method: "POST",
    body: formData,
  });

  console.log("response", response);

  return await response.json();
}

// will return the URL of the image
async function getEnhanced(blob) {
  const formData = new FormData();
  formData.append("image", blob, "canvas.png");

  const response = await fetch(BASE + "/api/enhance", {
    method: "POST",
    body: formData,
  });

  const resultBlob = await response.blob();
  return URL.createObjectURL(resultBlob);
}

export { getPrediction, getEnhanced };
