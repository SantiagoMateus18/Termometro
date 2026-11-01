// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDbqsssMbqTXPVLPJH2as4YEZzRmtF0IwM",
  authDomain: "loveometer.firebaseapp.com",
  databaseURL: "https://loveometer-default-rtdb.firebaseio.com",
  projectId: "loveometer",
  storageBucket: "loveometer.firebasestorage.app",
  messagingSenderId: "41744562668",
  appId: "1:41744562668:web:02d5bd3e5675660f9228c9",
  measurementId: "G-5FT1KBX06X"
};

// Inicializar Firebase y la Base de Datos
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const loveRef = database.ref('love_level');

let currentTemp = 75;   // Valor objetivo de temperatura (0 a 100)
let animatedTemp = 75;  // Valor suavizado para la animación
let isDragging = false;

// Variables de posición del termómetro
let cx, bulbY, bulbRadius, tubeWidth, tubeTopY, tubeHeight;

function setup() {
  let canvas = createCanvas(340, 480);
  canvas.parent('canvas-container');

  // Geometría del termómetro
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

  // Si el usuario está arrastrando el mercurio, actualizar valor local
  if (isDragging) {
    updateTempFromMouse();
  }

  // Animación fluida de transición del nivel
  animatedTemp = lerp(animatedTemp, currentTemp, 0.1);

  // Cambio dinámico de color (Azul a Rojo)
  let coldColor = color(41, 128, 185);
  let hotColor  = color(231, 76, 60);
  let currentColor = lerpColor(coldColor, hotColor, animatedTemp / 100);

  // 1. TUBO PRINCIPAL (Fondo)
  stroke(50, 40, 80);
  strokeWeight(4);
  fill(30, 24, 50);
  rect(cx - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight, 20, 20, 0, 0);

  // 2. MERCURIO Y LLENADO
  noStroke();
  fill(currentColor);

  // Pulso de corazón/latido en el bulbo
  let pulse = (animatedTemp > 60) ? sin(frameCount * 0.1) * (animatedTemp / 20) : 0;
  circle(cx, bulbY, (bulbRadius - 3 + pulse) * 2);

  // Columna de líquido
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

  // 4. MARCAS DEL TERMÓMETRO
  stroke(255, 255, 255, 50);
  strokeWeight(2);
  for (let i = 0; i <= 5; i++) {
    let yMark = map(i, 0, 5, bulbY - 20, tubeTopY + 20);
    line(cx + tubeWidth / 2 + 6, yMark, cx + tubeWidth / 2 + 16, yMark);
  }

  // 5. TEXTO Y MENSAJES
  noStroke();
  textAlign(CENTER, CENTER);

  // Porcentaje arriba
  fill(255);
  textSize(38);
  textStyle(BOLD);
  text(floor(animatedTemp) + "%", cx, 45);

  // Mensaje variable
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

// --- CONTROLES DE INTERACCIÓN Y SINCRONIZACIÓN ---

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
    // Envía la nueva temperatura a Firebase al soltar el slider
    loveRef.set(Math.round(currentTemp));
  }
}
