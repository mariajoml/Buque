# Buque — landing

Landing de Buque, consultoría de estrategia digital, marca, campañas e
inteligencia artificial.

Construida sobre el **Sistema Visual Fase 03**: color, tipografía, grilla de 12
columnas y reglas de movimiento salen del deck aprobado, no de criterios nuevos.

## Estructura

```
web/                     el sitio (lo que se publica)
  index.html
  assets/css/styles.css
  assets/js/main.js
  assets/fonts/          Bricolage Grotesque · Geologica · Homemade Apple
  assets/img/            textura-mar, wordmark, logos de aliados
.github/workflows/       despliegue automático a GitHub Pages
```

## Sistema

| Color    | Hex       | Uso                          |
|----------|-----------|------------------------------|
| Carbón   | `#12100F` | base y texto                 |
| Crema    | `#FFF0DA` | texto sobre carbón           |
| Naranja  | `#FF5A00` | acento dominante             |
| Rosa     | `#FF3E8E` | acento secundario            |
| Amarillo | `#FFD21C` | acento de resalte            |

Combinaciones de texto permitidas: carbón sobre crema, naranja, rosa o amarillo,
y crema sobre carbón. Las demás solo pueden aparecer como gesto decorativo.

Tres ritmos de grilla, uno por tipo de sección:

- **Puerto** — margen 6%, título 52–64 px · servicios y footer
- **Corriente** — margen 5%, título 64–80 px · manifiesto, aliados, charlas
- **Mar abierto** — margen 4%, título 80–112 px · hero, banda y CTA

Movimiento: duración 6–13 s, recorrido 3–5% del cuadro, escala 100–112%. Sin
flash, giro ni loop brusco. Todo se desactiva con `prefers-reduced-motion`.

## Desarrollo

```bash
python3 -m http.server 4173 --directory web
```

## Pendientes

- Reemplazar los logos de aliados en `web/assets/img/aliados/` por los oficiales
  (los actuales son aproximaciones provisionales).
- Enlaces reales de LinkedIn e Instagram.
- Confirmar las cifras del manifiesto.
