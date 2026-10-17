// =============================================
// UNIVERSO DE COLISIONES - CANVAS 2D
// =============================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const botonPausa = document.getElementById("btnPausa");
const estado = document.getElementById("estado");

let ancho = window.innerWidth;
let alto = window.innerHeight;
let pausado = false;
let ultimoTiempo = 0;
let acumulador = 0;

const TOTAL_PLANETAS = 20;
const VELOCIDAD_MAXIMA = 5;
const COLISIONES_LIMITE = 10;

const planetas = [];
const estrellas = [];
const particulas = [];
const agujerosNegros = [];
const paresEnContacto = new Set();

const COLORES = [
    "#ff5733", "#ff8c42", "#ffd166", "#f4e04d",
    "#7bd389", "#22c55e", "#20c9c3", "#29a8ff",
    "#4169e1", "#7656ff", "#a855f7", "#d946ef",
    "#ff4d9d", "#f72585", "#e76f51", "#bc6c25",
    "#8ecae6", "#90be6d", "#e9c46a", "#ef476f"
];

// =============================================
// AJUSTAR EL CANVAS A LA VENTANA
// =============================================

function ajustarCanvas() {
    const proporcion = window.devicePixelRatio || 1;

    ancho = window.innerWidth;
    alto = window.innerHeight;

    canvas.width = Math.round(ancho * proporcion);
    canvas.height = Math.round(alto * proporcion);

    canvas.style.width = ancho + "px";
    canvas.style.height = alto + "px";

    ctx.setTransform(proporcion, 0, 0, proporcion, 0, 0);

    crearEstrellas();
}

window.addEventListener("resize", ajustarCanvas);

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

function elegirColor() {
    return COLORES[Math.floor(Math.random() * COLORES.length)];
}

function mezclarColor(hex, cantidad) {
    const valor = parseInt(hex.replace("#", ""), 16);
    const r = (valor >> 16) & 255;
    const g = (valor >> 8) & 255;
    const b = valor & 255;

    const nr = Math.min(255, Math.floor(r + (255 - r) * cantidad));
    const ng = Math.min(255, Math.floor(g + (255 - g) * cantidad));
    const nb = Math.min(255, Math.floor(b + (255 - b) * cantidad));

    return `rgb(${nr}, ${ng}, ${nb})`;
}

// =============================================
// ESTRELLAS DEL ESPACIO
// =============================================

function crearEstrellas() {
    estrellas.length = 0;

    const cantidad = Math.max(
        120,
        Math.floor((ancho * alto) / 4500)
    );

    for (let i = 0; i < cantidad; i++) {
        estrellas.push({
            x: Math.random() * ancho,
            y: Math.random() * alto,
            radio: aleatorio(0.4, 1.8),
            brillo: aleatorio(0.2, 1),
            velocidadBrillo: aleatorio(0.3, 1.5)
        });
    }
}

function dibujarFondo(delta) {
    // Fondo negro con transparencia para conservar las estelas.
    ctx.fillStyle = "rgba(2, 3, 10, 0.25)";
    ctx.fillRect(0, 0, ancho, alto);

    // Nebulosas sutiles.
    const gradiente = ctx.createRadialGradient(
        ancho * 0.5, alto * 0.55, 0,
        ancho * 0.5, alto * 0.55, Math.max(ancho, alto) * 0.65
    );

    gradiente.addColorStop(0, "rgba(20, 24, 70, 0.09)");
    gradiente.addColorStop(0.55, "rgba(8, 20, 55, 0.05)");
    gradiente.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, ancho, alto);

    for (const estrella of estrellas) {
        estrella.brillo +=
            Math.sin(performance.now() * 0.001 * estrella.velocidadBrillo) *
            0.003 * delta;

        estrella.brillo = Math.max(
            0.2,
            Math.min(1, estrella.brillo)
        );

        ctx.beginPath();
        ctx.arc(
            estrella.x,
            estrella.y,
            estrella.radio,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = `rgba(210, 230, 255, ${estrella.brillo})`;
        ctx.fill();
    }
}

// =============================================
// CLASE PLANETA
// =============================================

class Planeta {
    constructor(indice) {
        this.nombre = "P" + (indice + 1);
        this.radio = aleatorio(11, 19);
        this.x = aleatorio(this.radio + 5, Math.max(this.radio + 6, ancho - this.radio - 5));
        this.y = aleatorio(this.radio + 100, Math.max(this.radio + 101, alto - this.radio - 30));

        this.color = COLORES[indice % COLORES.length];

        this.vx = aleatorio(-VELOCIDAD_MAXIMA, VELOCIDAD_MAXIMA);
        this.vy = aleatorio(-VELOCIDAD_MAXIMA, VELOCIDAD_MAXIMA);

        if (Math.abs(this.vx) < 1) this.vx = this.vx < 0 ? -1 : 1;
        if (Math.abs(this.vy) < 1) this.vy = this.vy < 0 ? -1 : 1;

        this.colisiones = 0;
        this.eliminado = false;
        this.rotacion = Math.random() * Math.PI * 2;
        this.ultimoContacto = 0;
    }

    actualizar(delta) {
        if (this.eliminado) return;

        const factor = delta / 16.667;

        this.x += this.vx * factor;
        this.y += this.vy * factor;
        this.rotacion += 0.006 * factor;

        // Rebote en los bordes.
        if (this.x - this.radio < 0) {
            this.x = this.radio;
            this.vx = Math.abs(this.vx);
        }

        if (this.x + this.radio > ancho) {
            this.x = ancho - this.radio;
            this.vx = -Math.abs(this.vx);
        }

        if (this.y - this.radio < 85) {
            this.y = 85 + this.radio;
            this.vy = Math.abs(this.vy);
        }

        if (this.y + this.radio > alto - 5) {
            this.y = alto - this.radio - 5;
            this.vy = -Math.abs(this.vy);
        }
    }

    dibujar() {
        if (this.eliminado) return;

        ctx.save();

        // Aura exterior.
        const aura = ctx.createRadialGradient(
            this.x, this.y, this.radio * 0.3,
            this.x, this.y, this.radio * 2.1
        );

        aura.addColorStop(0, mezclarColor(this.color, 0.2) + "");
        aura.addColorStop(0.35, this.color + "55");
        aura.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.globalAlpha = 0.45;
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio * 2.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;

        // Superficie esférica.
        const esfera = ctx.createRadialGradient(
            this.x - this.radio * 0.38,
            this.y - this.radio * 0.42,
            this.radio * 0.08,
            this.x,
            this.y,
            this.radio * 1.25
        );

        esfera.addColorStop(0, "#ffffff");
        esfera.addColorStop(0.13, mezclarColor(this.color, 0.45));
        esfera.addColorStop(0.55, this.color);
        esfera.addColorStop(1, "#10121c");

        ctx.fillStyle = esfera;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();

        // Manchas superficiales para dar apariencia planetaria.
        ctx.save();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio * 0.94, 0, Math.PI * 2);
        ctx.clip();

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotacion);

        ctx.globalAlpha = 0.28;
        ctx.fillStyle = mezclarColor(this.color, 0.65);

        ctx.beginPath();
        ctx.ellipse(
            -this.radio * 0.1,
            -this.radio * 0.3,
            this.radio * 0.75,
            this.radio * 0.2,
            0.25,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
            this.radio * 0.2,
            this.radio * 0.4,
            this.radio * 0.55,
            this.radio * 0.16,
            -0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();

        // Brillo en el borde.
        ctx.strokeStyle = mezclarColor(this.color, 0.55);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// =============================================
// DETECCIÓN Y RESOLUCIÓN DE COLISIONES
// =============================================

function detectarColisiones() {
    const contactosActuales = new Set();

    for (let i = 0; i < planetas.length; i++) {
        const a = planetas[i];

        if (a.eliminado) continue;

        for (let j = i + 1; j < planetas.length; j++) {
            const b = planetas[j];

            if (b.eliminado) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            // Distancia entre los centros.
            const distancia = Math.sqrt(dx * dx + dy * dy);
            const distanciaMinima = a.radio + b.radio;

            if (distancia < distanciaMinima) {
                const clave = a.nombre + "-" + b.nombre;
                contactosActuales.add(clave);

                // Registrar únicamente el inicio del contacto.
                if (!paresEnContacto.has(clave)) {
                    a.colisiones++;
                    b.colisiones++;

                    if (a.colisiones >= COLISIONES_LIMITE) {
                        crearAgujeroNegro(a);
                    }

                    if (b.colisiones >= COLISIONES_LIMITE) {
                        crearAgujeroNegro(b);
                    }
                }

                if (a.eliminado || b.eliminado) continue;

                // Evitar una división entre cero.
                const distanciaSegura = Math.max(distancia, 0.001);
                const nx = dx / distanciaSegura;
                const ny = dy / distanciaSegura;

                // Separar los planetas para evitar que se superpongan.
                const solapamiento = distanciaMinima - distancia;
                a.x -= nx * solapamiento / 2;
                a.y -= ny * solapamiento / 2;
                b.x += nx * solapamiento / 2;
                b.y += ny * solapamiento / 2;

                // Intercambio de la componente normal de la velocidad.
                const velocidadNormal =
                    (b.vx - a.vx) * nx +
                    (b.vy - a.vy) * ny;

                if (velocidadNormal < 0) {
                    const impulso = velocidadNormal;

                    a.vx += impulso * nx;
                    a.vy += impulso * ny;

                    b.vx -= impulso * nx;
                    b.vy -= impulso * ny;
                }

                // Destello en el punto de contacto.
                crearDestello(
                    (a.x + b.x) / 2,
                    (a.y + b.y) / 2,
                    a.color
                );
            }
        }
    }

    paresEnContacto.clear();

    for (const clave of contactosActuales) {
        paresEnContacto.add(clave);
    }
}

// =============================================
// DESTELLOS DE COLISIÓN
// =============================================

function crearDestello(x, y, color) {
    for (let i = 0; i < 7; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = aleatorio(1, 4);

        particulas.push({
            x,
            y,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad,
            radio: aleatorio(1, 3),
            vida: 1,
            color
        });
    }
}

// =============================================
// AGUJERO NEGRO Y GRAN EXPLOSIÓN
// =============================================

function crearAgujeroNegro(planeta) {
    if (planeta.eliminado) return;

    planeta.eliminado = true;

    agujerosNegros.push({
        x: planeta.x,
        y: planeta.y,
        radio: 3,
        edad: 0,
        duracion: 2200,
        color: planeta.color,
        rotacion: 0
    });

    // Explosión grande de partículas.
    for (let i = 0; i < 230; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = aleatorio(1, 9);

        particulas.push({
            x: planeta.x,
            y: planeta.y,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad,
            radio: aleatorio(2, 6),
            vida: 1,
            reduccion: aleatorio(0.003, 0.012),
            color: COLORES[Math.floor(Math.random() * COLORES.length)]
        });
    }

    // Destello central.
    particulas.push({
        x: planeta.x,
        y: planeta.y,
        vx: 0,
        vy: 0,
        radio: 60,
        vida: 1,
        reduccion: 0.035,
        color: "#ffffff",
        destello: true
    });
}

// =============================================
// DIBUJAR AGUJEROS NEGROS CON DOS ANILLOS
// =============================================

function dibujarAgujerosNegros(delta) {
    for (let i = agujerosNegros.length - 1; i >= 0; i--) {
        const agujero = agujerosNegros[i];

        agujero.edad += delta;
        agujero.rotacion += delta * 0.002;

        const progreso = Math.min(1, agujero.edad / agujero.duracion);
        const radioActual = 3 + progreso * 35;

        ctx.save();
        ctx.translate(agujero.x, agujero.y);

        // Resplandor exterior.
        const resplandor = ctx.createRadialGradient(
            0, 0, 2,
            0, 0, radioActual * 2.8
        );

        resplandor.addColorStop(0, "#000000");
        resplandor.addColorStop(0.35, agujero.color + "bb");
        resplandor.addColorStop(0.7, "#7c3aed44");
        resplandor.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = resplandor;
        ctx.beginPath();
        ctx.arc(0, 0, radioActual * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Dos anillos giratorios.
        for (let anillo = 0; anillo < 2; anillo++) {
            ctx.save();

            const direccion = anillo === 0 ? 1 : -1;
            ctx.rotate(agujero.rotacion * direccion + anillo * 0.8);
            ctx.scale(1, 0.35 + anillo * 0.12);

            ctx.strokeStyle = anillo === 0 ? "#39ddff" : "#ff4fd8";
            ctx.lineWidth = 2.5 - progreso;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.ellipse(
                0, 0,
                radioActual * (1.4 - progreso * 0.5),
                radioActual * (1.4 - progreso * 0.5),
                0, 0, Math.PI * 2
            );
            ctx.stroke();

            ctx.restore();
        }

        // Centro oscuro.
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(0, 0, radioActual * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (progreso >= 1) {
            agujerosNegros.splice(i, 1);
        }
    }
}

// =============================================
// ACTUALIZAR Y DIBUJAR PARTÍCULAS
// =============================================

function actualizarParticulas(delta) {
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];

        const factor = delta / 16.667;

        p.x += p.vx * factor;
        p.y += p.vy * factor;

        p.vx *= Math.pow(0.985, factor);
        p.vy *= Math.pow(0.985, factor);

        p.vida -= (p.reduccion || 0.018) * factor;
        p.radio *= Math.pow(0.992, factor);

        if (p.vida <= 0 || p.radio < 0.2) {
            particulas.splice(i, 1);
        }
    }
}

function dibujarParticulas() {
    for (const p of particulas) {
        ctx.save();

        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.destello ? 35 : 12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.2, p.radio), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// =============================================
// ACTUALIZAR CONTADOR
// =============================================

function actualizarEstado() {
    const activos = planetas.filter(p => !p.eliminado).length;

    estado.textContent =
        "Planetas: " + activos +
        " | Agujeros negros: " + agujerosNegros.length;
}

// =============================================
// BUCLE PRINCIPAL DE ANIMACIÓN
// =============================================

function animar(marcaTiempo) {
    requestAnimationFrame(animar);

    if (!ultimoTiempo) ultimoTiempo = marcaTiempo;

    const delta = Math.min(marcaTiempo - ultimoTiempo, 40);
    ultimoTiempo = marcaTiempo;

    if (pausado) return;

    dibujarFondo(delta);

    for (const planeta of planetas) {
        planeta.actualizar(delta);
    }

    detectarColisiones();

    actualizarParticulas(delta);
    dibujarParticulas();
    dibujarAgujerosNegros(delta);

    for (const planeta of planetas) {
        planeta.dibujar();
    }

    actualizarEstado();
}

// =============================================
// BOTÓN PARA PAUSAR Y REANUDAR
// =============================================

botonPausa.addEventListener("click", () => {
    pausado = !pausado;

    if (pausado) {
        botonPausa.textContent = "▶ REANUDAR";
    } else {
        botonPausa.textContent = "Ⅱ PAUSAR";
    }
});

// =============================================
// INICIAR SIMULACIÓN
// =============================================

function iniciar() {
    ajustarCanvas();

    // Fondo inicial completamente negro.
    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, ancho, alto);

    for (let i = 0; i < TOTAL_PLANETAS; i++) {
        planetas.push(new Planeta(i));
    }

    actualizarEstado();

    // Iniciar la animación.
    requestAnimationFrame(animar);
}

iniciar();
