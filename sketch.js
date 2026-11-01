// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  // Pega aquí tus credenciales de la consola de Firebase
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  databaseURL: "https://TU_PROJECT-default-rtdb.firebaseio.com",
  projectId: "TU_PROJECT",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const loveRef = database.ref('love_level');

let currentTemp = 75;   // Valor objetivo
let animatedTemp = 75;  // Valor suavizado
let isDragging = false;

let cx, bulbY, bulbRadius, tubeWidth, tubeTopY, tubeHeight;

function setup() {
  let canvas = createCanvas(340, 480);
  canvas.parent('canvas-container');

  cx = width / 2;
  bulbY = height - 100;
  bulbRadius = 38;
  tubeWidth = 36;
  tubeTopY = 90;
  tubeHeight = bulbY - tubeTopY;

  // Escuchar cambios en la base de datos en tiempo real
  loveRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val !== null && !isDragging) {
      currentTemp = val;
    }
  });
}

function draw() {
  background(18, 14, 36);

  if (isDragging) {
    updateTempFromMouse();
  }

  animatedTemp = lerp(animatedTemp, currentTemp, 0.1);

  let coldColor = color(41, 128, 185);
  let hotColor  = color(231, 76, 60);
  let currentColor = lerpColor(coldColor, hotColor, animatedTemp / 100);

  // 1. TUBO PRINCIPAL
  stroke(50, 40, 80);
  strokeWeight(4);
  fill(30, 24, 50);
  rect(cx - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight, 20, 20, 0, 0);

  // 2. MERCURIO
  noStroke();
  fill(currentColor);

  let pulse = (animatedTemp > 60) ? sin(frameCount * 0.1) * (animatedTemp / 20) : 0;
  circle(cx, bulbY, (bulbRadius - 3 + pulse) * 2);

  let fillHeight = map(animatedTemp, 0, 100, 0, tubeHeight - 12);
  rect(
    cx - (tubeWidth - 8) / 2, 
    bulbY - fillHeight, 
    tubeWidth - 8, 
    fillHeight + 12,
    8, 8, 0, 0
  );

  // 3. INDICADOR TÁCTIL
  stroke(255);
  strokeWeight(3);
  fill(currentColor);
  let handleY = bulbY - fillHeight;
  circle(cx, handleY, 20);

  // 4. MARCAS
  stroke(255, 255, 255, 50);
  strokeWeight(2);
  for (let i = 0; i <= 5; i++) {
    let yMark = map(i, 0, 5, bulbY - 20, tubeTopY + 20);
    line(cx + tubeWidth / 2 + 6, yMark, cx + tubeWidth / 2 + 16, yMark);
  }

  // 5. TEXTO Y MENSAJES
  noStroke();
  textAlign(CENTER, CENTER);

  fill(255);
  textSize(38);
  textStyle(BOLD);
  text(floor(animatedTemp) + "%", cx, 45);

  textSize(15);
  textStyle(NORMAL);
  fill(currentColor);
  
  let msg = "";
  if (animatedTemp < 15) msg = "❄️ Modo Congelado";
  else if (animatedTemp < 35) msg = "🧊 Un poco frío...";
  else if (animatedTemp < 65) msg = "🌤️ Amor Templado";
  else if (animatedTemp < 88) msg = "🔥 ¡Mucho Amor!";
  else msg = "💥 ¡CORAZÓN EXPLOSIVO!";

  text(msg, cx, bulbY + bulbRadius + 30);
}

function updateTempFromMouse() {
  let clampedY = constrain(mouseY, tubeTopY, bulbY);
  currentTemp = map(clampedY, bulbY, tubeTopY, 0, 100);
}

function mousePressed() {
  if (mouseX >= cx - tubeWidth * 1.5 && mouseX <= cx + tubeWidth * 1.5 &&
      mouseY >= tubeTopY - 20 && mouseY <= bulbY + bulbRadius) {
    isDragging = true;
    updateTempFromMouse();
  }
}

function mouseDragged() {
  if (isDragging) {
    updateTempFromMouse();
  }
}

function mouseReleased() {
  if (isDragging) {
    isDragging = false;
    // Guardar el valor final en Firebase al soltar
    loveRef.set(Math.round(currentTemp));
  }
}
