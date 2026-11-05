# Architect Your Mind

Conferencia de María José Muñoz (~65 min con las notas actuales, 24 diapositivas de contenido + 3 aperturas de bloque). Web estática sin
dependencias: abre `index.html` desde un servidor local.

```bash
python3 -m http.server 4174 --directory ignite-build
```

Luego `http://localhost:4174`. Funciona sin conexión (las fuentes van incluidas).

## Controles

| Tecla | Acción |
|---|---|
| → · Espacio · Enter · clic | siguiente paso |
| ← · Retroceso | paso anterior |
| ↓ / ↑ | saltar a la siguiente / anterior diapositiva |
| número + Enter | ir a esa posición del deck (ej. `11` Enter = actividad del muro) |
| F | pantalla completa |
| N | notas en la misma ventana |
| P | modo presentadora en otra ventana (actual, siguiente, notas, reloj) |
| T / R | en la actividad del muro (09): iniciar-pausar / reiniciar el temporizador de 60 s |

La URL guarda la posición en el deck (`#12.3` = posición 12, paso 3). Ojo: con las aperturas de bloque la posición ya no coincide con el número de la diapositiva del guion. Las dos ventanas
se sincronizan entre sí, incluido el temporizador.

## Sistema visual

Sale de la landing de Buque: carbón `#12100F`, crema `#FFF0DA`, naranja
`#FF5A00`, Bricolage Grotesque + Geologica, grilla de 12 columnas. La única
extensión es el azul `#3E6BFF`, que aparece desde la diapositiva 14 y
significa siempre «IA».

La arquitectura isométrica se genera en `deck.js` (`SCENES`).

Portada, cierre y aperturas de bloque usan la plantilla de Buque de «De la
idea al contenido»: el fondo de ondas con el asterisco (`img/portada-ondas.jpg`),
el wordmark con «ideas en movimiento» en Homemade Apple, y la banda líquida con
la palabra vertical (`img/textura-liquida.jpg`, teñida naranja, azul o rosa).
El logo de la Universidad del Rosario (`img/logo-urosario.png`) va arriba a la
izquierda en la portada y el cierre, como en esa plantilla.

## Ritmo sugerido

| Bloque | Diapositivas | Tiempo |
|---|---|---|
| Mentalidad (apertura «Mindset») | 01–13, con 07B «muros heredados» y 09B «can do / will do» | ~39 min |
| IA como habilitador (apertura «IA») | 14–18 | ~13,5 min |
| Construir y retos (apertura «Build») | 19–22 | ~11 min |

Las actividades (02, 09, 11, 21) suman ~7 min. Total con las notas actuales: ~65,5 min. Cada diapositiva lleva sus notas
con duración, frases clave y marcas `[TU HISTORIA]` para tus anécdotas reales.
