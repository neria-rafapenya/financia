# Documentación funcional de FINANCIA

## ¿Qué es FINANCIA?

FINANCIA es una aplicación para centralizar la gestión económica personal y documental en un único entorno.

Su objetivo es reunir en la misma experiencia:

- ingresos
- gastos
- documentos
- pagadores
- obligaciones fiscales derivadas
- simulaciones
- alertas y seguimiento operativo

La idea de producto no es solo almacenar datos, sino convertir documentos y movimientos en información reutilizable, revisable y trazable.

## ¿Qué hace hoy la aplicación de forma real?

Actualmente FINANCIA ya cubre una base funcional importante:

- autenticación de usuario
- dashboard con métricas agregadas
- subida y procesado documental
- OCR e interpretación LLM
- persistencia de campos estructurados
- consulta de ingresos y gastos por periodo
- gestión de pagadores
- consulta fiscal derivada
- simulación económica anual

Es decir, la base del producto ya existe y es operativa, aunque todavía hay módulos que deben cerrarse para considerar el proyecto terminado al 100%.

## ¿Cómo se organiza funcionalmente el producto?

A nivel funcional, FINANCIA se puede entender en varios bloques:

- acceso y perfil de usuario
- dashboard o visión ejecutiva
- documentos como fuente documental y trazable
- ingresos y gastos como capa operativa
- pagadores como entidades relacionadas
- fiscalidad como derivación y seguimiento
- simulaciones como capa de proyección

Además, en backend ya existen capacidades complementarias que deben quedar plenamente expuestas en frontend para cerrar el producto.

## ¿Qué cubre hoy la autenticación?

La autenticación cubre la base de acceso necesaria para operar la aplicación:

- registro
- login
- refresh de sesión
- logout
- endpoint de usuario autenticado

Con esto la experiencia ya permite acceso persistente y sesión operativa.

## ¿Qué le falta a autenticación para considerarse cerrada como producto?

Faltan varias piezas que elevan la autenticación desde “mecanismo técnico” a “módulo de producto personal serio”:

- recuperación de contraseña
- gestión visible de sesiones activas
- control de dispositivos o cierres remotos de sesión
- perfil fiscal o datos personales relevantes para reglas y fiscalidad

## ¿Qué papel tiene el dashboard?

El dashboard actúa como punto de entrada rápido a la información principal del usuario.

Actualmente resume:

- ingresos del ejercicio activo
- gastos del ejercicio activo
- estado documental
- alertas recientes
- enlaces directos a módulos clave

También incorpora contexto temporal del ejercicio actual.

## ¿Qué le falta al dashboard para estar terminado?

Le falta pasar de panel informativo a centro de acción.

El cierre funcional recomendado es que concentre:

- alertas accionables
- próximos vencimientos
- documentos pendientes de revisión
- gastos sin clasificar
- sugerencias de trabajo prioritario
- accesos directos al siguiente paso útil

## ¿Qué hace el módulo de documentos?

El módulo documental es uno de los núcleos de FINANCIA.

Actualmente permite:

- subir documentos
- validar tamaño y tipo de archivo
- optimizar imágenes cuando procede
- rotación manual antes del envío
- autoorientación en backend
- OCR con reintentos según orientación
- interpretación mediante LLM
- visualización del OCR y del resultado interpretado
- persistencia de campos estructurados
- edición inline de la referencia o título visible
- consulta de últimos documentos
- relación visual con fecha documental y estado

## ¿Qué son los campos persistidos?

Los campos persistidos son la capa donde la información interpretada deja de ser solo lectura OCR o interpretación LLM y pasa a convertirse en datos estructurados reutilizables por el producto.

Esa capa es clave porque conecta el procesamiento documental con módulos como gastos, ingresos, trazabilidad y revisión manual.

## ¿Qué le falta al módulo de documentos para estar completo?

Aunque es uno de los módulos más avanzados, todavía puede cerrarse más como hub de trazabilidad:

- búsqueda por contenido
- filtros por tipo, estado y ejercicio
- etiquetas o clasificación adicional
- relación visible con ingresos, gastos, contratos o pagos periódicos
- cola clara de revisión manual
- trazabilidad explícita de qué documento originó qué registro operativo

## ¿Qué cubre hoy el módulo de ingresos?

El backend ya soporta operaciones de ingresos y el frontend permite consulta por periodo.

Eso hace que el módulo exista funcionalmente, pero no todavía con la misma madurez de uso que debería tener una herramienta de gestión completa.

## ¿Qué le falta a ingresos?

El punto principal es cerrar la operativa manual completa en frontend:

- alta manual clara
- edición visible
- borrado visible y consistente
- mejor integración con documentos derivados
- estados y trazabilidad más evidentes

## ¿Qué cubre hoy el módulo de gastos?

La aplicación ya permite trabajar con gastos por periodo y, además, derivar gastos desde documentos procesados.

Esto es importante porque combina operativa manual con automatización documental.

## ¿Qué le falta a gastos?

Para dejarlo redondo como módulo operativo faltaría reforzar:

- edición más visible y completa
- mejor clasificación o revisión de estados
- mayor trazabilidad con documentos origen
- acceso directo desde incidencias o alertas

## ¿Qué papel tienen los pagadores?

Los pagadores son una entidad base del sistema.

Sirven para dar contexto y relación a información económica y documental, especialmente en ingresos, gastos o vínculos automáticos con documentos.

## ¿Qué le falta al módulo de pagadores?

El backend ya soporta CRUD, pero en frontend todavía debe cerrarse la operativa completa:

- edición visible
- borrado visible
- mejor relación con documentos o movimientos

## ¿Qué cubre hoy fiscalidad?

Fiscalidad ya ofrece una capa útil de consulta:

- obligaciones derivadas
- resumen agregado
- vencimientos próximos

Esto aporta valor inmediato, sobre todo cuando hay facturas o documentos con impacto fiscal.

## ¿Qué le falta a fiscalidad para cerrar el producto?

Le falta convertirse en un módulo operativo y no solo consultivo:

- calendario fiscal
- checklist de cierre trimestral o anual
- flujo de revisión
- preparación de trabajo pendiente
- exportación o resumen consolidado

## ¿Qué cubre hoy simulaciones?

Simulaciones ya aporta una visión útil de estimación anual.

Eso la convierte en una primera capa de proyección económica, válida como base del producto.

## ¿Qué le falta a simulaciones?

La evolución natural es pasar de una estimación aislada a un simulador real de escenarios:

- comparador entre escenarios
- plantillas de casos comunes
- cambio de empleo
- paso a autónomo
- variación de retenciones
- impacto de pagos periódicos o cambios recurrentes

## ¿Qué capacidades existen ya en backend pero aún no están cerradas como módulos visibles en frontend?

Hay tres bloques especialmente importantes:

- contratos
- pagos periódicos
- alertas

Esto significa que la capacidad técnica base ya existe, pero la experiencia de producto todavía no la está explotando del todo en frontend.

## ¿Por qué es importante exponer contratos, pagos periódicos y alertas en frontend?

Porque ayudan a cerrar el círculo operativo del producto.

Sin esas pantallas, el backend tiene capacidad, pero el usuario no percibe que el sistema esté terminado.

Exponerlas permitiría:

- convertir alertas en acciones
- hacer seguimiento de compromisos o relaciones contractuales
- gestionar pagos que se repiten y afectan a proyección y control

## ¿Qué significa “cerrar la brecha backend/frontend” en este proyecto?

Significa que toda capacidad relevante ya implementada en backend debe estar disponible en frontend con:

- navegación propia
- pantalla propia
- lectura y escritura cuando corresponda
- flujo de uso entendible
- integración con dashboard y documentos

Mientras eso no ocurra, el producto sigue pareciendo más pequeño de lo que realmente es.

## ¿Qué funcionalidades son prioritarias para la finalización del proyecto?

El orden de cierre recomendado es este:

1. exponer contratos, pagos periódicos y alertas en frontend
2. completar CRUD visible de ingresos, gastos y pagadores
3. convertir el dashboard en centro de acción
4. reforzar documentos como hub de trazabilidad
5. completar autenticación como producto serio
6. cerrar fiscalidad operativa
7. dejar simulaciones avanzadas como fase final

## ¿Cómo sabremos que el proyecto está realmente terminado?

Una definición útil de cierre es esta:

El proyecto puede considerarse terminado cuando un usuario puede entrar, registrar o importar información, revisarla, corregirla, actuar sobre ella y seguir sus pendientes sin salir del producto ni depender de módulos incompletos.

Eso implica que no basta con tener endpoints o pantallas de consulta: hace falta una experiencia completa de uso y seguimiento.

## FAQ: Campos persistidos en el detalle de procesado

## ¿Qué entendemos como "campos persistidos" en un detalle de procesado?

En este proyecto, "campos persistidos" son los datos estructurados de un documento que ya no están solo en el OCR o en la interpretación del LLM, sino que han sido guardados como valores normalizados y asociados al documento.

Dicho de forma simple:

- El OCR extrae texto bruto.
- El LLM interpreta ese texto y propone una estructura.
- Los campos persistidos son los valores finales que el sistema conserva como datos utilizables.

## ¿Dónde se ven en la aplicación?

Se muestran en la sección "Campos persistidos" dentro del detalle procesado de documentos.

En frontend, esa sección se renderiza a partir de `selectedDocument.fieldValues`.

## ¿Qué información tiene cada campo persistido?

Cada campo persistido representa un dato concreto del documento, por ejemplo:

- proveedor
- importe total
- fecha de emisión
- número de factura
- método de pago

Además, cada registro guarda metadatos para saber:

- qué campo es
- qué valor tiene
- de dónde salió
- con qué nivel de confianza se obtuvo
- si ha sido verificado

## ¿En qué se diferencia de OCR o del resultado LLM?

La diferencia importante es esta:

- OCR: devuelve texto libre o lectura cruda del documento.
- LLM: devuelve una interpretación estructurada o semiestructurada del contenido.
- Campos persistidos: son los datos ya aterrizados al modelo de negocio de la aplicación.

Por tanto, OCR y LLM forman parte del procesamiento; los campos persistidos forman parte del resultado consolidado.

## Ejemplo práctico

Supongamos una factura.

El OCR podría devolver algo parecido a esto:

"Factura proveedor Acme. Base 100. IVA 21. Total 121."

El LLM podría interpretarlo como:

- proveedor: Acme
- base imponible: 100
- IVA: 21
- total: 121

Los campos persistidos serían ya registros concretos y reutilizables, por ejemplo:

- `vendorName = Acme`
- `subtotalAmount = 100`
- `vatAmount = 21`
- `totalAmount = 121`

Y cada uno podría quedar marcado con:

- origen: `OCR`, `LLM`, `RULE` o `MANUAL`
- confianza: `HIGH`, `MEDIUM` o `LOW`

## ¿Por qué son importantes?

Porque representan lo que el sistema considera ya consolidado y reutilizable por otras partes de la aplicación.

No son solo texto leído o interpretación narrativa: son datos preparados para consultas, trazabilidad, revisión y uso funcional dentro del producto.

## Resumen

Cuando hablamos de "campos persistidos" en el detalle de procesado, hablamos de los valores estructurados del documento que el sistema ya ha guardado de forma estable para poder trabajar con ellos después.