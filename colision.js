
"use strict";

// ========================================
// JUEGO DE BELLOTAS - PRACTICA 2.5
// ========================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let ancho = window.innerWidth;
let alto = window.innerHeight;

const TOTAL_BELLOTAS = 25;
const bellotas = [];

let atrapadas = 0;
let velocidadGlobal = 1;

const fondo = new Image();
fondo.src = "fondo-arbol.png";

let fondoCargado = false;

fondo.onload = () => {
    fondoCargado = true;
};

fondo.onerror = () => {
    console.error("No se pudo cargar fondo-arbol.png");
};

// ========================================
// AJUSTAR EL CANVAS
// ========================================

function ajustarCanvas() {
    const escala = window.devicePixelRatio || 1;

    ancho = window.innerWidth;
    alto = window.innerHeight;

    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);

    canvas.style.width = ancho + "px";
    canvas.style.height = alto + "px";

    ctx.setTransform(escala, 0, 0, escala, 0, 0);
}

window.addEventListener("resize", ajustarCanvas);

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

// ========================================
// CLASE BELLOTA
// ========================================

class Bellota {
    constructor() {
        this.radio = aleatorio(12, 19);
        this.reiniciar(true);
    }

    reiniciar(inicial = false) {
        this.x = aleatorio(this.radio, ancho - this.radio);

        this.y = inicial
            ? aleatorio(-alto, alto)
            : aleatorio(-180, -30);

        this.vy = aleatorio(1.5, 3.5);
        this.vx = aleatorio(-0.7, 0.7);
        this.rotacion = Math.random() * Math.PI * 2;
        this.velocidadRotacion = aleatorio(-0.04, 0.04);
    }

    actualizar(delta) {
        const factor = delta / 16.667;

        this.x += this.vx * factor;
        this.y += this.vy * velocidadGlobal * factor;
        this.rotacion += this.velocidadRotacion * factor;

        // Rebote en los bordes laterales.
        if (this.x < this.radio) {
            this.x = this.radio;
            this.vx = Math.abs(this.vx);
        }

        if (this.x > ancho - this.radio) {
            this.x = ancho - this.radio;
            this.vx = -Math.abs(this.vx);
        }

        // Volver a aparecer arriba al salir por abajo.
        if (this.y - this.radio > alto) {
            this.reiniciar();
        }
    }

    dibujar() {
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotacion);

        // Cuerpo de la bellota.
        const cuerpo = ctx.createLinearGradient(
            -this.radio, 0,
            this.radio, 0
        );

        cuerpo.addColorStop(0, "#713514");
        cuerpo.addColorStop(0.45, "#bd7734");
        cuerpo.addColorStop(1, "#59250e");

        ctx.fillStyle = cuerpo;

        ctx.beginPath();
        ctx.ellipse(
            0, this.radio * 0.18,
            this.radio * 0.7,
            this.radio,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Sombrero.
        ctx.fillStyle = "#75451f";

        ctx.beginPath();
        ctx.ellipse(
            0, -this.radio * 0.35,
            this.radio * 0.85,
            this.radio * 0.4,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Textura del sombrero.
        ctx.strokeStyle = "#4b2b15";
        ctx.lineWidth = 1.5;

        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.radio * 0.25, -this.radio * 0.58);
            ctx.lineTo(i * this.radio * 0.3, -this.radio * 0.2);
            ctx.stroke();
        }

        // Tallo.
        ctx.strokeStyle = "#49301b";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -this.radio * 0.65);
        ctx.lineTo(this.radio * 0.1, -this.radio);
        ctx.stroke();

        // Brillo.
        ctx.fillStyle = "rgba(255, 220, 160, 0.5)";
        ctx.beginPath();
        ctx.ellipse(
            -this.radio * 0.2,
            this.radio * 0.2,
            this.radio * 0.13,
            this.radio * 0.3,
            -0.2, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    }
}

// ========================================
// CREAR LAS 25 BELLOTAS
// ========================================

for (let i = 0; i < TOTAL_BELLOTAS; i++) {
    bellotas.push(new Bellota());
}

// ========================================
// DIBUJAR EL FONDO
// ========================================

function dibujarFondo() {
    if (fondoCargado) {
        ctx.drawImage(fondo, 0, 0, ancho, alto);
    } else {
        ctx.fillStyle = "#233b28";
        ctx.fillRect(0, 0, ancho, alto);
    }
}

// ========================================
// CONTADOR DE BELLOTAS
// ========================================

function dibujarContador() {
    const texto = "Bellotas atrapadas: " + atrapadas;

    ctx.save();
    ctx.font = "bold 20px Arial";

    const anchoTexto = ctx.measureText(texto).width;
    const x = ancho - anchoTexto - 45;
    const y = 25;

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";

    ctx.beginPath();
    ctx.roundRect(
        x - 15, y - 12,
        anchoTexto + 30, 40,
        12
    );
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, x, y + 8);

    ctx.restore();
}

// ========================================
// ATRAPAR BELLOTAS CON CLIC
// ========================================

canvas.addEventListener("click", (evento) => {
    const rect = canvas.getBoundingClientRect();

    const mouseX = evento.clientX - rect.left;
    const mouseY = evento.clientY - rect.top;

    // Comprobar si el clic coincide con alguna bellota.
    for (const bellota of bellotas) {
        const dx = mouseX - bellota.x;
        const dy = mouseY - bellota.y;

        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia <= bellota.radio + 5) {
            atrapadas++;

            bellota.reiniciar();

            // Incrementar la velocidad al superar 10 y 20 capturas.
            if (atrapadas === 11) {
                velocidadGlobal = 1.3;
            } else if (atrapadas === 21) {
                velocidadGlobal = 1.8;
            }

            break;
        }
    }
});

// ========================================
// BUCLE DE ANIMACIÓN
// ========================================

let tiempoAnterior = 0;

function animar(tiempo) {
    if (tiempoAnterior === 0) {
        tiempoAnterior = tiempo;
    }

    const delta = Math.min(tiempo - tiempoAnterior, 40);
    tiempoAnterior = tiempo;

    dibujarFondo();

    for (const bellota of bellotas) {
        bellota.actualizar(delta);
        bellota.dibujar();
    }

    dibujarContador();

    requestAnimationFrame(animar);
}

// ========================================
// INICIAR EL JUEGO
// ========================================

ajustarCanvas();
requestAnimationFrame(animar);
