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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const loveRef = database.ref('love_level');

let currentTemp = 75;   
let animatedTemp = 75;  
let isDragging = false;

// Variables de geometría adaptable
let cx, bulbY, bulbRadius, tubeWidth, tubeTopY, tubeHeight;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
  textFont('Fredoka');

  recalculateLayout();

  loveRef.on('value', (snapshot) => {
    const val = snapshot.val();
    if (val !== null && !isDragging) {
      currentTemp = val;
    }
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  recalculateLayout();
}

function recalculateLayout() {
  cx = width / 2;
  
  let maxH = min(height * 0.7, 520);
  let baseUnit = min(width, height);
  
  tubeWidth = constrain(baseUnit * 0.1, 32, 46);
  bulbRadius = tubeWidth * 1.15;
  
  tubeTopY = (height - maxH) / 2 + 30;
  bulbY = tubeTopY + maxH - bulbRadius;
  tubeHeight = bulbY - tubeTopY;
}

function draw() {
  background(15, 12, 32);

  if (isDragging) {
    updateTempFromMouse();
  }

  animatedTemp = lerp(animatedTemp, currentTemp, 0.1);

  let coldColor = color(41, 128, 185);
  let hotColor  = color(231, 76, 60);
  let currentColor = lerpColor(coldColor, hotColor, animatedTemp / 100);

  let fillHeight = map(animatedTemp, 0, 100, 0, tubeHeight - 10);
  let handleY = bulbY - fillHeight;

  // -------------------------------------------------------------
  // SOMBRA ESTILO CÓMIC (Fondo proyectado)
  // -------------------------------------------------------------
  let shadowOffset = 6;
  push();
  translate(shadowOffset, shadowOffset);
  fill(0, 0, 0, 180);
  noStroke();

  rect(cx - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight, 24, 24, 0, 0);
  circle(cx, bulbY, bulbRadius * 2);
  pop();

  // -------------------------------------------------------------
  // ESTRUCTURA PRINCIPAL DEL TERMÓMETRO (Delineado Negro)
  // -------------------------------------------------------------
  stroke(10, 8, 20);
  strokeWeight(3.5);

  // 1. Tubo Fondo y Bulbo Exterior
  fill(28, 22, 48);
  rect(cx - tubeWidth / 2, tubeTopY, tubeWidth, tubeHeight, 20, 20, 0, 0);
  circle(cx, bulbY, bulbRadius * 2);

  // 2. LLENADO DE MERCURIO UNIFICADO (Sin brecha entre bulbo y barra)
  noStroke();
  fill(currentColor);

  let pulse = (animatedTemp > 60) ? sin(frameCount * 0.1) * (animatedTemp / 22) : 0;
  
  // Bulbo relleno
  circle(cx, bulbY, (bulbRadius - 3 + pulse) * 2);

  // Barra de mercurio conectada directamente desde la base del bulbo
  rect(
    cx - (tubeWidth - 8) / 2, 
    handleY, 
    tubeWidth - 8, 
    bulbY - handleY + (bulbRadius / 2), 
    6, 6, 0, 0
  );

  // 3. INDICADOR TÁCTIL (Manija/Punta en el nivel)
  stroke(10, 8, 20);
  strokeWeight(3);
  fill(currentColor);
  circle(cx, handleY, 20);
  
  fill(255, 255, 255, 200);
  noStroke();
  circle(cx - 3, handleY - 3, 5); // Brillo estilizado

  // 4. MARCAS DE GRADUACIÓN
  stroke(255, 255, 255, 70);
  strokeWeight(2.5);
  for (let i = 0; i <= 5; i++) {
    let yMark = map(i, 0, 5, bulbY - 15, tubeTopY + 15);
    line(cx + tubeWidth / 2 + 6, yMark, cx + tubeWidth / 2 + 16, yMark);
  }

  // 5. TEXTO Y MENSAJES DINÁMICOS
  noStroke();
  textAlign(CENTER, CENTER);

  // Porcentaje arriba
  fill(10, 8, 20);
  textSize(min(width * 0.1, 44));
  textStyle(BOLD);
  text(floor(animatedTemp) + "%", cx + 2, tubeTopY - 43);

  fill(255);
  text(floor(animatedTemp) + "%", cx, tubeTopY - 45);

  // Mensaje inferior personalizado
  textSize(min(width * 0.045, 18));
  textStyle(NORMAL);
  fill(currentColor);

  let msg = "";
  if (animatedTemp < 15) msg = "Me odias literal";
  else if (animatedTemp < 35) msg = "¿Por qué bajó tanto? ¿qué hice?";
  else if (animatedTemp < 65) msg = "Bueno, me amas";
  else if (animatedTemp < 88) msg = "Más Linda, MUAK";
  else msg = "Yo tambien TE AAAAAMO";

  text(msg, cx, bulbY + bulbRadius + 40);
}

// --- INTERACCIÓN TÁCTIL Y DE RATÓN ---

function updateTempFromMouse() {
  let clampedY = constrain(mouseY, tubeTopY, bulbY);
  currentTemp = map(clampedY, bulbY, tubeTopY, 0, 100);
}

function mousePressed() {
  if (mouseX >= cx - tubeWidth * 2 && mouseX <= cx + tubeWidth * 2 &&
      mouseY >= tubeTopY - 30 && mouseY <= bulbY + bulbRadius + 20) {
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
    
    // 1. Guardar en la base de datos para que se sincronice visualmente
    loveRef.set(Math.round(currentTemp));

    // 2. Determinar el mensaje para la notificación
    let notifMsg = "";
    if (currentTemp < 15) notifMsg = "Me odias literal";
    else if (currentTemp < 35) notifMsg = "¿Por qué bajó tanto? ¿qué hice?";
    else if (currentTemp < 65) notifMsg = "Bueno, me amas";
    else if (currentTemp < 88) notifMsg = "Más Linda, MUAK";
    else notifMsg = "Yo tambien TE AAAAAMO";

    // 3. Enviar notificación push gratis a tu Android vía ntfy
    fetch('https://ntfy.sh/loveOmeter', {
      method: 'POST',
      body: `El nivel está al ${Math.round(currentTemp)}%. ${notifMsg}`,
      headers: {
        'Title': '❤️ Termómetro de Amor actualizado',
        'Tags': 'heart,fire'
      }
    });
  }
}
