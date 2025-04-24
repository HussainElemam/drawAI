async function getPrediction(blob) {
  const formData = new FormData();
  formData.append("image", blob, "canvas.png");

  let response = await fetch("http://localhost:8080/api/predict", {
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

  const response = await fetch("http://localhost:8080/api/enhance", {
    method: "POST",
    body: formData,
  });

  const resultBlob = await response.blob();
  return URL.createObjectURL(resultBlob);
}

export { getPrediction, getEnhanced };
