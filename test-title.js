// Test auto-title generation logic
const message = "What is artificial intelligence and how does it work in modern applications?";
const messagePreview = message.trim();
let titleLength = 50;

if (messagePreview.length > 50) {
  const periodIndex = messagePreview.indexOf(".", 40);
  const questionIndex = messagePreview.indexOf("?", 40);
  const exclamationIndex = messagePreview.indexOf("!", 40);
  const lastSpaceIndex = messagePreview.lastIndexOf(" ", 60);
  
  console.log("periodIndex:", periodIndex);
  console.log("questionIndex:", questionIndex);
  console.log("exclamationIndex:", exclamationIndex);
  console.log("lastSpaceIndex:", lastSpaceIndex);
  
  if (periodIndex > 40 && periodIndex < 70) {
    titleLength = periodIndex;
  } else if (questionIndex > 40 && questionIndex < 70) {
    titleLength = questionIndex;
  } else if (exclamationIndex > 40 && exclamationIndex < 70) {
    titleLength = exclamationIndex;
  } else if (lastSpaceIndex > 40) {
    titleLength = lastSpaceIndex;
  }
}

const title = messagePreview.slice(0, titleLength).trim();
console.log("Title:", title);
console.log("Title length:", title.length);
